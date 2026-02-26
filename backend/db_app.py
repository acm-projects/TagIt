import os 
from flask import Flask, jsonify
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__) 
MONGO_URI = os.getenv("MONGO_URI")

try:
    client = MongoClient(MONGO_URI)
    db = client.get_database()
    client.admin.command('ping') 
    print("Connected to MongoDP and pinged")
except Exception as e: 
    print(f"Error connecting to MongoDB: {e}")  


app = Flask(__name__) 

@app.route("/get_all", methods=["GET"]) 
def home():
    db.get
    return jsonify({"message": "Welcome to the TagIt API!"}) 


if __name__ == "__main__":
    app.run(debug=True, port=8000) 
