import os 
from flask import Flask, jsonify, request
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__) 
MONGO_URI = os.getenv("MONGO_URI")

try:
    client = MongoClient(MONGO_URI)
    db = client.get_database()
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
    result = db.emails.insert_one(incoming_data)
    return jsonify({
        "message": "Email successfully saved to the filing cabinet!", 
        "id": str(result.inserted_id)
    }), 201


if __name__ == "__main__":
    app.run(debug=True, port=8000) 
