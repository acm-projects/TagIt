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
    client.admin.command('ping')
    print("Connected to MongoDB and pinged")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")


@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Welcome to the TagIt API!"})


@app.route("/api/emails", methods=["POST"])
def add_email():
    incoming_data = request.json

    subject = incoming_data.get("subject", "No Subject")
    body = incoming_data.get("body", "No Body Content")

    print(f"Processing email: {subject}")

    ai_results = analyze_email_with_gemini(subject, body)

    incoming_data["aiAnalysis"] = ai_results

    result = db.emails.insert_one(incoming_data)

    return jsonify({
        "message": "Email processed and saved!",
        "id": str(result.inserted_id),
        "ai_summary": ai_results["summary"]
    }), 201


@app.route("/api/emails/batch", methods=["POST"])
def add_emails_batch():
    """
    Accept a list of up to 25 emails, analyze them all in one Gemini prompt,
    save each to MongoDB, and return all 25 summaries.
    """
    incoming_emails = request.json  # Expected: list of { id, subject, body, snippet, ... }

    if not isinstance(incoming_emails, list) or len(incoming_emails) == 0:
        return jsonify({"error": "Request body must be a non-empty array of emails."}), 400

    if len(incoming_emails) > 25:
        return jsonify({"error": "Batch limit is 25 emails."}), 400

    print(f"Batch processing {len(incoming_emails)} emails in one prompt...")

    ai_results = analyze_emails_batch(incoming_emails)

    saved = []
    for i, email_data in enumerate(incoming_emails):
        analysis = ai_results[i] if i < len(ai_results) else {
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
        email_data["aiAnalysis"] = analysis
        result = db.emails.insert_one(email_data)
        saved.append({
            "id": email_data.get("id", str(result.inserted_id)),
            "subject": email_data.get("subject", "No Subject"),
            "summary": analysis.get("summary", ""),
            "assignedCategory": analysis.get("assignedCategory", "Other"),
            "priorityLevel": analysis.get("priorityLevel", 4),
            "uiBadges": analysis.get("uiBadges", []),
            "tasks": analysis.get("tasks", []),
            "deadlines": analysis.get("deadlines", []),
            "events": analysis.get("events", []),
            "location": analysis.get("location", ""),
            "time": analysis.get("time", ""),
            "mongo_id": str(result.inserted_id),
        })

    return jsonify({
        "message": f"{len(saved)} emails processed and saved!",
        "count": len(saved),
        "results": saved,
    }), 201


if __name__ == "__main__":
    app.run(debug=True, port=8000)