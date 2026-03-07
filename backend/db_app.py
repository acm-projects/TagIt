import os
from flask import Flask, jsonify, request
from pymongo import MongoClient
from dotenv import load_dotenv
import certifi 

from AI_Summary import analyze_email_with_gemini


load_dotenv()
app = Flask(__name__)
MONGO_URI = os.getenv("MONGO_URI")

try:
    mongo_client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
    db = mongo_client.get_database("tagit")
    mongo_client.admin.command('ping')
    print("Connected to MongoDB")
except Exception as e:
    print(f"MongoDB connection failed: {e}")
    raise SystemExit(1)



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

if __name__ == "__main__":
    app.run(debug=True, port=8000)