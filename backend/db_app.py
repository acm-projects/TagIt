import os
from flask import Flask, jsonify, request
from pymongo import MongoClient
from dotenv import load_dotenv
import certifi
from flask_cors import CORS

from AI_Summary import analyze_email_with_gemini, analyze_emails_batch, is_spam, is_spam_batch, client as gemini_client
from auth_routes import auth_bp, get_username_from_request

load_dotenv()
app = Flask(__name__)
MONGO_URI = os.getenv("MONGO_URI")

# Fixed: explicitly allow Authorization header
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

app.register_blueprint(auth_bp)

try:
    client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
    db = client.get_default_database()
    # Migrate: drop old single-field index if it exists, create compound (id, username)
    try:
        db.emails.drop_index("id_1")
    except Exception:
        pass
    db.emails.create_index([("id", 1), ("username", 1)], unique=True, sparse=True)
    client.admin.command('ping')
    print("Connected to MongoDB and pinged")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")


def _format_email_result(doc):
    """Return a consistent shape from a MongoDB document."""
    analysis = doc.get("aiAnalysis", {})
    return {
        "id":               doc.get("id", str(doc.get("_id", ""))),
        "subject":          doc.get("subject", "No Subject"),
        "summary":          analysis.get("summary", ""),
        "assignedCategory": analysis.get("assignedCategory", "Other"),
        "priorityLevel":    analysis.get("priorityLevel", 4),
        "uiBadges":         analysis.get("uiBadges", []),
        "tasks":            analysis.get("tasks", []),
        "deadlines":        analysis.get("deadlines", []),
        "events":           analysis.get("events", []),
        "location":         analysis.get("location", ""),
        "time":             analysis.get("time", ""),
        "isSpam":           doc.get("isSpam", False),
        "spamReason":       doc.get("spamReason", ""),
        "sender":           doc.get("sender", ""),
        "receivedAt":       doc.get("receivedAt", ""),
        "source":           doc.get("source", ""),
        "mongo_id":         str(doc.get("_id", "")),
        "cached":           True,
    }


def _get_user_preferences(username):
    """Pull school and priorityTopics for a given username."""
    if not username:
        return "", []
    user = db["Users"].find_one({"username": username}, {"school": 1, "priorityTopics": 1})
    if not user:
        return "", []
    return user.get("school", ""), user.get("priorityTopics", [])


@app.route("/api/emails/user", methods=["GET"])
def get_user_emails():
    """Return all non-spam emails for the authenticated user, newest first."""
    username = get_username_from_request()
    if not username:
        return jsonify({"error": "Unauthorized."}), 401

    docs = list(db.emails.find(
        {"username": username, "isSpam": {"$ne": True}},
    ).sort("_id", -1).limit(200))

    emails = [_format_email_result(doc) for doc in docs]
    return jsonify({"emails": emails}), 200


@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Welcome to the TagIt API!"})


@app.route("/api/emails", methods=["POST"])
def add_email():
    incoming_data = request.json

    email_id = incoming_data.get("id")
    subject  = incoming_data.get("subject", "No Subject")
    body     = incoming_data.get("body", "No Body Content")
    sender   = incoming_data.get("sender", "")

    username = get_username_from_request() or ""
    incoming_data["username"] = username

    # Return cached version if this email id was already processed
    if email_id:
        existing = db.emails.find_one({"id": email_id, "username": username})
        if existing:
            print(f"Cache hit for email id {email_id}")
            result = _format_email_result(existing)
            return jsonify({
                "message": "Email already processed (cached).",
                "id": result["id"],
                "ai_summary": result["summary"],
                "isSpam": result["isSpam"],
                "cached": True,
            }), 200

    # Step 1: spam gate
    spam_flagged, spam_reason = is_spam(subject, body)
    if spam_flagged:
        print(f"Spam detected: {subject}")
        incoming_data["isSpam"] = True
        incoming_data["spamReason"] = spam_reason
        incoming_data["aiAnalysis"] = {
            "summary": f"Spam/phishing detected: {spam_reason}",
            "assignedCategory": "Spam",
            "priorityLevel": 4,
            "uiBadges": ["Spam"],
            "tasks": [],
            "deadlines": [],
            "events": [],
            "location": "",
            "time": "",
        }
        db.emails.insert_one(incoming_data)
        return jsonify({
            "message": "Email flagged as spam.",
            "id": email_id or "",
            "ai_summary": incoming_data["aiAnalysis"]["summary"],
            "isSpam": True,
            "cached": False,
        }), 201

    # Step 2: full analysis for legitimate emails
    school, priority_topics = _get_user_preferences(username)
    print(f"Processing email: {subject}")
    ai_results = analyze_email_with_gemini(subject, body, sender, school, priority_topics)
    incoming_data["aiAnalysis"] = ai_results
    incoming_data["isSpam"] = False
    incoming_data["spamReason"] = ""

    result = db.emails.insert_one(incoming_data)

    return jsonify({
        "message": "Email processed and saved!",
        "id": str(result.inserted_id),
        "ai_summary": ai_results["summary"],
        "isSpam": False,
        "cached": False,
    }), 201


@app.route("/api/emails/batch", methods=["POST"])
def add_emails_batch():
    """
    Accept a list of up to 25 emails.
    - Already-seen emails (matched by their provider id) are returned straight
      from the database — no AI call, no duplicate insert.
    - New emails are grouped into one Gemini prompt, saved, then returned.
    The response preserves the original request order.
    """
    incoming_emails = request.json

    if not isinstance(incoming_emails, list) or len(incoming_emails) == 0:
        return jsonify({"error": "Request body must be a non-empty array of emails."}), 400

    if len(incoming_emails) > 25:
        return jsonify({"error": "Batch limit is 25 emails."}), 400

    # Split into cached vs new
    new_emails  = []   # emails that need AI processing
    new_indices = []   # their original positions
    results_map = {}   # index -> result dict

    username = get_username_from_request() or ""

    all_ids = [e.get("id") for e in incoming_emails if e.get("id")]
    existing_docs = {
        doc["id"]: doc
        for doc in db.emails.find({"id": {"$in": all_ids}, "username": username})
        if "id" in doc
    } if all_ids else {}

    for i, email_data in enumerate(incoming_emails):
        email_id = email_data.get("id")
        if email_id and email_id in existing_docs:
            formatted = _format_email_result(existing_docs[email_id])
            formatted["cached"] = True
            results_map[i] = formatted
            print(f"[batch] Cache hit: {email_id}")
        else:
            new_emails.append(email_data)
            new_indices.append(i)

    # Only call Gemini for emails we have never seen before
    if new_emails:
        # One batch spam check instead of one call per email
        spam_flags = is_spam_batch(new_emails)

        legit_emails  = [e for e, (f, _) in zip(new_emails, spam_flags) if not f]
        legit_indices = [idx for idx, (f, _) in zip(new_indices, spam_flags) if not f]
        spam_emails   = [(e, idx, r) for e, idx, (f, r) in zip(new_emails, new_indices, spam_flags) if f]

        # Tag every new email with the current user before insert
        for email_data in new_emails:
            email_data["username"] = username

        # Handle spam right away — no Gemini analysis needed
        for email_data, orig_idx, reason in spam_emails:
            print(f"[batch] Spam detected: {email_data.get('subject')}")
            spam_analysis = {
                "summary": f"Spam/phishing detected: {reason}",
                "assignedCategory": "Spam",
                "priorityLevel": 4,
                "uiBadges": ["Spam"],
                "tasks": [], "deadlines": [], "events": [], "location": "", "time": "",
            }
            email_data["aiAnalysis"] = spam_analysis
            email_data["isSpam"] = True
            email_data["spamReason"] = reason
            try:
                db.emails.insert_one(email_data)
            except Exception:
                pass
            results_map[orig_idx] = {
                "id": email_data.get("id", ""),
                "subject": email_data.get("subject", "No Subject"),
                "summary": spam_analysis["summary"],
                "assignedCategory": "Spam",
                "priorityLevel": 4,
                "uiBadges": ["Spam"],
                "tasks": [], "deadlines": [], "events": [], "location": "", "time": "",
                "isSpam": True, "spamReason": reason,
                "mongo_id": "", "cached": False,
            }

        print(f"[batch] Processing {len(legit_emails)} new email(s) via Gemini...")
        if legit_emails:
            school, priority_topics = _get_user_preferences(username)
            ai_results = analyze_emails_batch(legit_emails, school, priority_topics)

        fallback = {
            "summary": "AI result missing for this email.",
            "assignedCategory": "Other",
            "priorityLevel": 4,
            "uiBadges": ["Error"],
            "tasks": [],
            "deadlines": [],
            "events": [],
            "location": "",
            "time": "",
        }

        for j, email_data in enumerate(legit_emails):
            analysis = ai_results[j] if j < len(ai_results) else fallback
            email_data["aiAnalysis"] = analysis
            email_data["isSpam"] = False
            email_data["spamReason"] = ""

            try:
                insert_result = db.emails.insert_one(email_data)
                mongo_id = str(insert_result.inserted_id)
            except Exception as e:
                print(f"[batch] Insert conflict for {email_data.get('id')}: {e}")
                existing = db.emails.find_one({"id": email_data.get("id")})
                if existing:
                    formatted = _format_email_result(existing)
                    formatted["cached"] = True
                    results_map[legit_indices[j]] = formatted
                    continue
                mongo_id = "unknown"

            results_map[legit_indices[j]] = {
                "id":               email_data.get("id", mongo_id),
                "subject":          email_data.get("subject", "No Subject"),
                "summary":          analysis.get("summary", ""),
                "assignedCategory": analysis.get("assignedCategory", "Other"),
                "priorityLevel":    analysis.get("priorityLevel", 4),
                "uiBadges":         analysis.get("uiBadges", []),
                "tasks":            analysis.get("tasks", []),
                "deadlines":        analysis.get("deadlines", []),
                "events":           analysis.get("events", []),
                "location":         analysis.get("location", ""),
                "time":             analysis.get("time", ""),
                "isSpam":           False,
                "spamReason":       "",
                "mongo_id":         mongo_id,
                "cached":           False,
            }

    ordered_results = [results_map[i] for i in range(len(incoming_emails))]
    cached_count = sum(1 for r in ordered_results if r.get("cached"))
    new_count    = len(ordered_results) - cached_count

    return jsonify({
        "message":      f"{len(ordered_results)} emails returned ({new_count} new, {cached_count} from cache).",
        "count":        len(ordered_results),
        "new_count":    new_count,
        "cached_count": cached_count,
        "results":      ordered_results,
    }), 200


@app.route("/api/chat", methods=["POST"])
def chat():
    """
    RAG-based inbox Q&A. Pull recent email summaries from MongoDB
    and let Gemini answer the user's question using only that data.
    """
    data = request.json
    question = data.get("question", "").strip()
    username = data.get("username", "")

    if not question:
        return jsonify({"error": "No question provided."}), 400

    # Pull the last 50 processed (non-spam) emails to use as context
    recent_docs = list(db.emails.find(
        {"isSpam": {"$ne": True}},
        {"subject": 1, "aiAnalysis": 1, "_id": 0}
    ).sort("_id", -1).limit(50))

    if not recent_docs:
        return jsonify({"answer": "No emails have been processed yet. Fetch your emails first!"}), 200

    context_parts = []
    for doc in recent_docs:
        analysis = doc.get("aiAnalysis", {})
        subject = doc.get("subject", "No Subject")
        summary = analysis.get("summary", "")
        tasks = "; ".join(analysis.get("tasks", []))
        deadlines = "; ".join(analysis.get("deadlines", []))
        events = "; ".join(analysis.get("events", []))
        location = analysis.get("location", "")
        time_val = analysis.get("time", "")

        entry = f"- Subject: {subject} | Summary: {summary}"
        if tasks:
            entry += f" | Tasks: {tasks}"
        if deadlines:
            entry += f" | Deadlines: {deadlines}"
        if events:
            entry += f" | Events: {events}"
        if location:
            entry += f" | Location: {location}"
        if time_val:
            entry += f" | Time: {time_val}"
        context_parts.append(entry)

    context = "\n".join(context_parts)

    prompt = f"""You are a helpful inbox assistant for a UT Dallas student.
Answer the user's question using ONLY the email data provided below.
If the answer isn't in the data, say you don't see that in their recent emails.
Keep your answer concise and helpful.

Email data:
{context}

Question: {question}
"""

    try:
        response = gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        return jsonify({"answer": response.text.strip()}), 200
    except Exception as e:
        print(f"Chat error: {e}")
        return jsonify({"error": "Could not generate a response."}), 500


if __name__ == "__main__":
    app.run(debug=True, port=8000)