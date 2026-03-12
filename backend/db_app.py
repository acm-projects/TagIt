import os
from flask import Flask, jsonify, request
from pymongo import MongoClient
from dotenv import load_dotenv
import certifi
from flask_cors import CORS

from AI_Summary import analyze_email_with_gemini, analyze_emails_batch
from auth_routes import auth_bp

load_dotenv()
app = Flask(__name__)
MONGO_URI = os.getenv("MONGO_URI")

# Fixed: explicitly allow Authorization header
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

app.register_blueprint(auth_bp)

try:
    client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
    db = client.get_default_database()
    # Unique index on provider email id so duplicate inserts are rejected at DB level too
    db.emails.create_index("id", unique=True, sparse=True)
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
        "mongo_id":         str(doc.get("_id", "")),
        "cached":           True,
    }


@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Welcome to the TagIt API!"})


@app.route("/api/emails", methods=["POST"])
def add_email():
    incoming_data = request.json

    email_id = incoming_data.get("id")
    subject  = incoming_data.get("subject", "No Subject")
    body     = incoming_data.get("body", "No Body Content")

    # Return cached version if this email id was already processed
    if email_id:
        existing = db.emails.find_one({"id": email_id})
        if existing:
            print(f"Cache hit for email id {email_id}")
            result = _format_email_result(existing)
            return jsonify({
                "message": "Email already processed (cached).",
                "id": result["id"],
                "ai_summary": result["summary"],
                "cached": True,
            }), 200

    print(f"Processing email: {subject}")
    ai_results = analyze_email_with_gemini(subject, body)
    incoming_data["aiAnalysis"] = ai_results

    result = db.emails.insert_one(incoming_data)

    return jsonify({
        "message": "Email processed and saved!",
        "id": str(result.inserted_id),
        "ai_summary": ai_results["summary"],
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

    all_ids = [e.get("id") for e in incoming_emails if e.get("id")]
    existing_docs = {
        doc["id"]: doc
        for doc in db.emails.find({"id": {"$in": all_ids}})
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
        print(f"[batch] Processing {len(new_emails)} new email(s) via Gemini...")
        ai_results = analyze_emails_batch(new_emails)

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

        for j, email_data in enumerate(new_emails):
            analysis = ai_results[j] if j < len(ai_results) else fallback
            email_data["aiAnalysis"] = analysis

            try:
                insert_result = db.emails.insert_one(email_data)
                mongo_id = str(insert_result.inserted_id)
            except Exception as e:
                # Race condition: another request inserted the same id first
                print(f"[batch] Insert conflict for {email_data.get('id')}: {e}")
                existing = db.emails.find_one({"id": email_data.get("id")})
                if existing:
                    formatted = _format_email_result(existing)
                    formatted["cached"] = True
                    results_map[new_indices[j]] = formatted
                    continue
                mongo_id = "unknown"

            results_map[new_indices[j]] = {
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


if __name__ == "__main__":
    app.run(debug=True, port=8000)