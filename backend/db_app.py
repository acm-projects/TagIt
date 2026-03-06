import os
from flask import Flask, jsonify, request
from pymongo import MongoClient
from dotenv import load_dotenv
import certifi 
from flask_cors import CORS

from AI_Summary import analyze_email_with_gemini


load_dotenv()
app = Flask(__name__) 
MONGO_URI = os.getenv("MONGO_URI")
CORS(app)

try:
    # Add certifi.where() to fix the Mac SSL handshake error
    client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
    
    # Use get_default_database() so it knows which cluster to use
    db = client.get_default_database()
    
    client.admin.command('ping') 
    print("✅ Connected to MongoDB and pinged")
except Exception as e: 
    print(f"❌ Error connecting to MongoDB: {e}") 



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
