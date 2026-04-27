import os
import traceback
from flask import Flask, jsonify, request
from pymongo import MongoClient
from dotenv import load_dotenv
import certifi
from flask_cors import CORS

from AI_Summary import analyze_email_with_gemini, analyze_emails_batch, is_spam, is_spam_batch, call_gemini_with_retry
from auth_routes import auth_bp, get_username_from_request

# Bump this whenever the spam detection logic improves significantly.
# Any cached non-spam email with a lower spamVersion will be re-spam-checked on next sync.
CURRENT_SPAM_VERSION = 2

# Bump this whenever priorities need to be re-evaluated for all emails.
# Any email with a lower priorityVersion will be re-analyzed on next sync.
CURRENT_PRIORITY_VERSION = 1

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
    db.dismissed_tasks.create_index([("username", 1), ("key", 1)], unique=True, sparse=True)
    db.dismissed_emails.create_index([("username", 1), ("emailId", 1)], unique=True, sparse=True)
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
        "needsReply":       analysis.get("needsReply", False),
        "draftReply":       analysis.get("draftReply", ""),
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
    """Return all non-spam, non-dismissed emails for the authenticated user, newest first."""
    username = get_username_from_request()
    if not username:
        return jsonify({"error": "Unauthorized."}), 401

    dismissed_ids = {d["emailId"] for d in db.dismissed_emails.find({"username": username}, {"emailId": 1})}

    query = {
        "username": username,
        "isSpam": False,
        "aiAnalysis.uiBadges": {"$nin": ["Error"]},
    }
    if dismissed_ids:
        query["id"] = {"$nin": list(dismissed_ids)}

    docs = list(db.emails.find(query).sort("_id", -1).limit(200))

    emails = [_format_email_result(doc) for doc in docs]
    return jsonify({"emails": emails}), 200


@app.route("/api/emails/dismiss", methods=["POST"])
def dismiss_email():
    """Permanently hide an email from the user's mail list."""
    username = get_username_from_request()
    if not username:
        return jsonify({"error": "Unauthorized."}), 401

    data = request.json
    email_id = (data or {}).get("emailId", "").strip()
    if not email_id:
        return jsonify({"error": "Missing emailId."}), 400

    try:
        db.dismissed_emails.insert_one({"username": username, "emailId": email_id})
    except Exception:
        pass  # Already dismissed — idempotent

    return jsonify({"message": "Dismissed."}), 200


@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Welcome to the TagIt API!"})


@app.route("/api/emails", methods=["POST"])
def add_email():
    username = get_username_from_request()
    if not username:
        return jsonify({"error": "Unauthorized."}), 401

    incoming_data = request.json

    email_id = incoming_data.get("id")
    subject  = incoming_data.get("subject", "No Subject")
    body     = incoming_data.get("body", "No Body Content")
    sender   = incoming_data.get("sender", "")

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

    # Step 1: spam gate (fetch preferences first so promotional override works)
    school, priority_topics = _get_user_preferences(username)
    spam_flagged, spam_reason = is_spam(subject, body, priority_topics)
    if spam_flagged:
        print(f"Spam detected: {subject}")
        incoming_data["isSpam"] = True
        incoming_data["spamReason"] = spam_reason
        incoming_data["spamVersion"] = CURRENT_SPAM_VERSION
        incoming_data["priorityVersion"] = CURRENT_PRIORITY_VERSION
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
            "needsReply": False,
            "draftReply": "",
        }
        db.emails.insert_one(incoming_data)
        return jsonify({
            "message": "Email flagged as spam.",
            "id": email_id or "",
            "ai_summary": incoming_data["aiAnalysis"]["summary"],
            "isSpam": True,
            "cached": False,
        }), 201

    # Step 2: full analysis for legitimate emails (school/priority_topics already fetched above)
    print(f"Processing email: {subject}")
    received_at = incoming_data.get("receivedAt", "")
    ai_results = analyze_email_with_gemini(subject, body, sender, school, priority_topics, received_at)
    incoming_data["aiAnalysis"] = ai_results
    incoming_data["isSpam"] = False
    incoming_data["spamReason"] = ""
    incoming_data["spamVersion"] = CURRENT_SPAM_VERSION
    incoming_data["priorityVersion"] = CURRENT_PRIORITY_VERSION

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

    username = get_username_from_request()
    if not username:
        return jsonify({"error": "Unauthorized."}), 401

    if not isinstance(incoming_emails, list) or len(incoming_emails) == 0:
        return jsonify({"error": "Request body must be a non-empty array of emails."}), 400

    if len(incoming_emails) > 100:
        return jsonify({"error": "Batch limit is 100 emails."}), 400

    # Split into cached vs new
    new_emails  = []   # emails that need full AI processing
    new_indices = []   # their original positions
    results_map = {}   # index -> result dict
    # Cached non-spam emails whose spam check predates CURRENT_SPAM_VERSION
    respam_emails  = []   # (incoming email_data, existing doc, original index)
    # Cached emails whose priority analysis predates CURRENT_PRIORITY_VERSION
    repriority_emails = []  # (incoming email_data, existing doc, original index)

    all_ids = [e.get("id") for e in incoming_emails if e.get("id")]
    existing_docs = {
        doc["id"]: doc
        for doc in db.emails.find({"id": {"$in": all_ids}, "username": username})
        if "id" in doc
    } if all_ids else {}

    for i, email_data in enumerate(incoming_emails):
        email_id = email_data.get("id")
        if email_id and email_id in existing_docs:
            doc = existing_docs[email_id]
            # If the cached doc is missing newer AI fields, has an Error badge,
            # or still uses the old plain-string deadline format, force re-analysis
            ai = doc.get("aiAnalysis", {})
            has_error = "Error" in ai.get("uiBadges", [])
            deadlines = ai.get("deadlines", [])
            has_old_deadline_format = any(isinstance(d, str) for d in deadlines) if deadlines else False
            if "needsReply" not in ai or has_error or has_old_deadline_format:
                reason = ("Error badge" if has_error
                          else "old deadline format" if has_old_deadline_format
                          else "missing needsReply")
                print(f"[batch] Stale cache ({reason}), re-analyzing: {email_id}")
                new_emails.append(email_data)
                new_indices.append(i)
            elif (not doc.get("isSpam", False)
                  and doc.get("spamVersion", 0) < CURRENT_SPAM_VERSION):
                # Non-spam email from before this spam version — re-check with new rules
                respam_emails.append((email_data, doc, i))
                print(f"[batch] Stale spam version, will re-check: {email_id}")
            elif (not doc.get("isSpam", False)
                  and doc.get("priorityVersion", 0) < CURRENT_PRIORITY_VERSION):
                # Non-spam email from before this priority version — re-analyze with new priorities
                repriority_emails.append((email_data, doc, i))
                print(f"[batch] Stale priority version, will re-analyze: {email_id}")
            else:
                formatted = _format_email_result(doc)
                formatted["cached"] = True
                results_map[i] = formatted
                print(f"[batch] Cache hit: {email_id}")
        else:
            new_emails.append(email_data)
            new_indices.append(i)

    # Re-run spam check on emails that predate the current spam filter version
    if respam_emails:
        school, priority_topics = _get_user_preferences(username)
        respam_payloads = [{"subject": ed.get("subject",""), "body": ed.get("body","")} for ed, _, _ in respam_emails]
        respam_flags = is_spam_batch(respam_payloads, priority_topics)
        for (email_data, doc, orig_idx), (flagged, reason) in zip(respam_emails, respam_flags):
            eid = email_data.get("id")
            if flagged:
                print(f"[batch] Re-spam caught: {email_data.get('subject')}")
                spam_analysis = {
                    "summary": f"Filtered: {reason}",
                    "assignedCategory": "Spam",
                    "priorityLevel": 4,
                    "uiBadges": ["Spam"],
                    "tasks": [], "deadlines": [], "events": [], "location": "", "time": "",
                    "needsReply": False, "draftReply": "",
                }
                db.emails.update_one(
                    {"id": eid, "username": username},
                    {"$set": {"isSpam": True, "spamReason": reason, "aiAnalysis": spam_analysis, "spamVersion": CURRENT_SPAM_VERSION}},
                )
                results_map[orig_idx] = {
                    "id": eid, "subject": email_data.get("subject",""),
                    "summary": spam_analysis["summary"], "assignedCategory": "Spam",
                    "priorityLevel": 4, "uiBadges": ["Spam"],
                    "tasks": [], "deadlines": [], "events": [], "location": "", "time": "",
                    "needsReply": False, "draftReply": "", "isSpam": True,
                    "spamReason": reason, "mongo_id": "", "cached": True,
                }
            else:
                # Still clean — just bump the version stamps
                db.emails.update_one(
                    {"id": eid, "username": username},
                    {"$set": {"spamVersion": CURRENT_SPAM_VERSION, "priorityVersion": CURRENT_PRIORITY_VERSION}},
                )
                formatted = _format_email_result(doc)
                formatted["cached"] = True
                results_map[orig_idx] = formatted

    # Re-analyze emails with outdated priority version
    if repriority_emails:
        print(f"[batch] Found {len(repriority_emails)} emails to re-prioritize")
        school, priority_topics = _get_user_preferences(username)
        print(f"[batch] User priorities: {priority_topics}")
        repriority_payloads = [
            {
                "subject": ed.get("subject", ""),
                "body": ed.get("body", ""),
                "received_at": ed.get("receivedAt", "")
            }
            for ed, _, _ in repriority_emails
        ]
        repriority_results = analyze_emails_batch(repriority_payloads, school, priority_topics)
        for (email_data, doc, orig_idx), new_analysis in zip(repriority_emails, repriority_results):
            eid = email_data.get("id")
            old_priority = doc.get("aiAnalysis", {}).get("priorityLevel", "?")
            new_priority = new_analysis.get("priorityLevel", "?")
            print(f"[batch] Re-prioritized '{email_data.get('subject')}': level {old_priority} → {new_priority}, badges: {new_analysis.get('uiBadges', [])}")
            # Update with new analysis and priority version
            db.emails.update_one(
                {"id": eid, "username": username},
                {
                    "$set": {
                        "aiAnalysis": new_analysis,
                        "priorityVersion": CURRENT_PRIORITY_VERSION,
                        "spamVersion": CURRENT_SPAM_VERSION
                    }
                },
            )
            formatted = _format_email_result(db.emails.find_one({"id": eid, "username": username}))
            formatted["cached"] = True
            results_map[orig_idx] = formatted
    else:
        print(f"[batch] No emails to re-prioritize for user {username}")

    # Only call Gemini for emails we have never seen before
    if new_emails:
        # Fetch user preferences before spam check so promotional override works
        school, priority_topics = _get_user_preferences(username)

        # One batch spam check instead of one call per email
        spam_flags = is_spam_batch(new_emails, priority_topics)

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
                "summary": f"Filtered: {reason}",
                "assignedCategory": "Spam",
                "priorityLevel": 4,
                "uiBadges": ["Spam"],
                "tasks": [], "deadlines": [], "events": [], "location": "", "time": "",
                # needsReply MUST be present — its absence triggers re-analysis on every sync
                "needsReply": False,
                "draftReply": "",
            }
            email_data["aiAnalysis"] = spam_analysis
            email_data["isSpam"] = True
            email_data["spamReason"] = reason
            email_data["spamVersion"] = CURRENT_SPAM_VERSION
            email_data["priorityVersion"] = CURRENT_PRIORITY_VERSION
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
                "needsReply": False, "draftReply": "",
                "isSpam": True, "spamReason": reason,
                "mongo_id": "", "cached": False,
            }

        print(f"[batch] Processing {len(legit_emails)} new email(s) via Gemini...")
        if legit_emails:
            # Pass received_at per email so the AI can resolve relative deadline dates
            for e in legit_emails:
                e.setdefault("received_at", e.get("receivedAt", ""))
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
            email_data["spamVersion"] = CURRENT_SPAM_VERSION
            email_data["priorityVersion"] = CURRENT_PRIORITY_VERSION

            try:
                # Use upsert so re-analyzed emails update the existing record instead of failing
                doc_to_set = {k: v for k, v in email_data.items() if k != "_id"}
                result = db.emails.update_one(
                    {"id": email_data.get("id"), "username": username},
                    {"$set": doc_to_set},
                    upsert=True,
                )
                if result.upserted_id:
                    mongo_id = str(result.upserted_id)
                else:
                    existing = db.emails.find_one({"id": email_data.get("id"), "username": username})
                    mongo_id = str(existing.get("_id", "")) if existing else "unknown"
            except Exception as e:
                print(f"[batch] Upsert error for {email_data.get('id')}: {e}")
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


@app.route("/api/tasks/user", methods=["GET"])
def get_user_tasks():
    """
    Extract tasks and deadlines from all processed emails for the current user.
    Excludes any that have been permanently dismissed.
    Each item gets a stable key derived from the email id + index so the frontend
    can dismiss individual items.
    """
    username = get_username_from_request()
    if not username:
        return jsonify({"error": "Unauthorized."}), 401

    # Load dismissed keys for this user
    dismissed_docs = db.dismissed_tasks.find({"username": username}, {"key": 1})
    dismissed_keys = {d["key"] for d in dismissed_docs}

    docs = list(db.emails.find(
        {"username": username, "isSpam": False},
    ).sort("_id", -1).limit(200))

    items = []
    for doc in docs:
        email_id = doc.get("id", str(doc.get("_id", "")))
        subject = doc.get("subject", "No Subject")
        analysis = doc.get("aiAnalysis", {})
        source = doc.get("source", "")
        received = doc.get("receivedAt", "")

        time_val = analysis.get("time", "")
        location_val = analysis.get("location", "")

        for i, task_text in enumerate(analysis.get("tasks", [])):
            key = f"task:{email_id}:{i}"
            if key in dismissed_keys:
                continue
            items.append({
                "key": key,
                "type": "task",
                "text": task_text,
                "emailSubject": subject,
                "emailId": email_id,
                "source": source,
                "receivedAt": received,
                "time": time_val,
                "location": location_val,
                "priorityLevel": analysis.get("priorityLevel", 4),
            })

        for i, deadline_entry in enumerate(analysis.get("deadlines", [])):
            key = f"deadline:{email_id}:{i}"
            if key in dismissed_keys:
                continue
            # Handle both new format {"text": ..., "date": "YYYY-MM-DD"} and legacy plain strings
            if isinstance(deadline_entry, dict):
                deadline_text = deadline_entry.get("text", "")
                deadline_date = deadline_entry.get("date", "")
                # Store as ISO datetime string (date only, no time component)
                deadline_time = f"{deadline_date}T00:00:00" if deadline_date else time_val
            else:
                deadline_text = str(deadline_entry)
                deadline_time = time_val  # legacy: fall back to email event time
            items.append({
                "key": key,
                "type": "deadline",
                "text": deadline_text,
                "emailSubject": subject,
                "emailId": email_id,
                "source": source,
                "receivedAt": received,
                "time": deadline_time,
                "location": location_val,
                "priorityLevel": analysis.get("priorityLevel", 4),
            })

    return jsonify({"items": items}), 200


@app.route("/api/tasks/dismiss", methods=["POST"])
def dismiss_task():
    """
    Permanently dismiss a task or deadline so it never comes back.
    Body: { "key": "task:<emailId>:<index>" }
    """
    username = get_username_from_request()
    if not username:
        return jsonify({"error": "Unauthorized."}), 401

    data = request.json
    key = (data or {}).get("key", "").strip()
    if not key:
        return jsonify({"error": "Missing key."}), 400

    try:
        db.dismissed_tasks.insert_one({"username": username, "key": key})
    except Exception:
        pass  # Already dismissed — idempotent

    return jsonify({"message": "Dismissed."}), 200


@app.route("/api/tasks/dismiss-batch", methods=["POST"])
def dismiss_tasks_batch():
    """
    Permanently dismiss multiple tasks/deadlines at once.
    Body: { "keys": ["task:<emailId>:<index>", ...] }
    """
    username = get_username_from_request()
    if not username:
        return jsonify({"error": "Unauthorized."}), 401

    data = request.json
    keys = (data or {}).get("keys", [])
    if not isinstance(keys, list) or not keys:
        return jsonify({"error": "Missing keys array."}), 400

    for key in keys:
        key = str(key).strip()
        if not key:
            continue
        try:
            db.dismissed_tasks.insert_one({"username": username, "key": key})
        except Exception:
            pass

    return jsonify({"message": f"Dismissed {len(keys)} items."}), 200


@app.route("/api/events/user", methods=["GET"])
def get_user_events():
    """
    Extract calendar events from all processed emails for the current user.
    Excludes any that have been permanently dismissed.
    Each item gets a stable key so the frontend can dismiss individual items.
    """
    username = get_username_from_request()
    if not username:
        return jsonify({"error": "Unauthorized."}), 401

    dismissed_docs = db.dismissed_tasks.find({"username": username}, {"key": 1})
    dismissed_keys = {d["key"] for d in dismissed_docs}

    docs = list(db.emails.find(
        {"username": username, "isSpam": False},
    ).sort("_id", -1).limit(200))

    items = []
    for doc in docs:
        email_id = doc.get("id", str(doc.get("_id", "")))
        subject = doc.get("subject", "No Subject")
        analysis = doc.get("aiAnalysis", {})
        source = doc.get("source", "")
        received = doc.get("receivedAt", "")
        location = analysis.get("location", "")
        time_val = analysis.get("time", "")
        priority = analysis.get("priorityLevel", 4)

        for i, event_text in enumerate(analysis.get("events", [])):
            key = f"event:{email_id}:{i}"
            if key in dismissed_keys:
                continue
            items.append({
                "key": key,
                "text": event_text,
                "emailSubject": subject,
                "emailId": email_id,
                "source": source,
                "receivedAt": received,
                "location": location,
                "time": time_val,
                "priorityLevel": priority,
            })

    return jsonify({"items": items}), 200


@app.route("/api/chat", methods=["POST"])
def chat():
    """
    RAG-based inbox Q&A. Pull recent email summaries from MongoDB
    and let Gemini answer the user's question using only that data.
    """
    username = get_username_from_request()
    if not username:
        return jsonify({"error": "Unauthorized."}), 401

    data = request.json
    question = (data or {}).get("question", "").strip()

    if not question:
        return jsonify({"error": "No question provided."}), 400

    # Pull the last 50 processed (non-spam) emails for this user only
    recent_docs = list(db.emails.find(
        {"username": username, "isSpam": False},
        {"subject": 1, "aiAnalysis": 1, "_id": 0}
    ).sort("_id", -1).limit(50))

    if not recent_docs:
        return jsonify({"answer": "No emails have been processed yet. Fetch your emails first!"}), 200

    def _summary_list(items):
        if not items:
            return ""
        normalized = []
        for item in items:
            if isinstance(item, dict):
                text = item.get("text", "")
                date = item.get("date", "")
                if text and date:
                    normalized.append(f"{text} ({date})")
                elif text:
                    normalized.append(text)
                elif date:
                    normalized.append(date)
            elif item is None:
                continue
            else:
                normalized.append(str(item))
        return "; ".join(normalized)

    context_parts = []
    for doc in recent_docs:
        analysis = doc.get("aiAnalysis", {})
        subject = doc.get("subject", "No Subject")
        summary = analysis.get("summary", "")
        tasks = _summary_list(analysis.get("tasks", []))
        deadlines = _summary_list(analysis.get("deadlines", []))
        events = _summary_list(analysis.get("events", []))
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
        response = call_gemini_with_retry(
            prompt,
            model="gemini-3.1-pro-preview",
        )
        return jsonify({"answer": response.text.strip()}), 200
    except Exception as e:
        print(f"Chat error: {e}")
        traceback.print_exc()
        return jsonify({"error": "Could not generate a response.", "detail": str(e)}), 500


@app.route("/api/drafts/user", methods=["GET"])
def get_user_drafts():
    """
    Return emails from the current Mon-Sun week that the AI flagged as needing
    a reply, along with the AI-generated draft reply text.
    Emails from previous weeks are silently excluded (and hard-deleted from DB).
    """
    from datetime import datetime, timedelta

    username = get_username_from_request()
    if not username:
        return jsonify({"error": "Unauthorized."}), 401

    # Compute Monday midnight of the current week (UTC) as a comparable string
    today = datetime.utcnow()
    monday = today - timedelta(days=today.weekday())
    week_start_str = monday.strftime("%Y-%m-%d")  # "YYYY-MM-DD"

    dismissed_ids = {d["emailId"] for d in db.dismissed_emails.find({"username": username}, {"emailId": 1})}
    query = {"username": username, "isSpam": False, "aiAnalysis.needsReply": True}
    if dismissed_ids:
        query["id"] = {"$nin": list(dismissed_ids)}

    docs = list(db.emails.find(query).sort("_id", -1).limit(200))

    # Hard-delete drafts from previous weeks and build the current-week list
    old_ids = []
    drafts = []
    for doc in docs:
        received = doc.get("receivedAt", "")
        # receivedAt may be a full ISO string; compare only the date prefix
        date_prefix = received[:10] if len(received) >= 10 else ""
        if date_prefix and date_prefix < week_start_str:
            old_ids.append(doc.get("_id"))
            continue
        analysis = doc.get("aiAnalysis", {})
        drafts.append({
            "id":         doc.get("id", str(doc.get("_id", ""))),
            "subject":    doc.get("subject", "No Subject"),
            "sender":     doc.get("sender", ""),
            "draftReply": analysis.get("draftReply", ""),
            "receivedAt": received,
            "source":     doc.get("source", ""),
        })

    # Remove stale drafts from DB so they never come back
    if old_ids:
        try:
            db.emails.delete_many({"_id": {"$in": old_ids}})
        except Exception:
            pass

    return jsonify({"drafts": drafts}), 200


if __name__ == "__main__":
    app.run(debug=True, port=8000)