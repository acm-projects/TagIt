import os
import certifi
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from flask import Blueprint, jsonify, request
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

auth_bp = Blueprint("auth", __name__)

MONGO_URI = os.getenv("MONGO_URI")
JWT_SECRET = os.getenv("JWT_SECRET", "changeme_use_a_real_secret")

client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
db = client.get_default_database()
users_col = db["Users"]


def make_token(username: str) -> str:
    payload = {
        "username": username,
        "exp": datetime.now(timezone.utc) + timedelta(days=30),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


@auth_bp.route("/auth/signup", methods=["POST"])
def signup():
    data = request.json
    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return jsonify({"error": "Username and password are required."}), 400

    if users_col.find_one({"username": username}):
        return jsonify({"error": "Username already taken."}), 409

    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    users_col.insert_one({"username": username, "password": hashed})

    token = make_token(username)
    return jsonify({"message": "Account created successfully.", "token": token, "username": username}), 201


@auth_bp.route("/auth/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return jsonify({"error": "Username and password are required."}), 400

    user = users_col.find_one({"username": username})

    if not user or not bcrypt.checkpw(password.encode("utf-8"), user["password"]):
        return jsonify({"error": "Invalid username or password."}), 401

    token = make_token(username)
    return jsonify({"message": "Signed in successfully.", "token": token, "username": username}), 200


@auth_bp.route("/auth/verify", methods=["GET"])
def verify():
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.removeprefix("Bearer ").strip()

    if not token:
        return jsonify({"error": "No token provided."}), 401

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return jsonify({"username": payload["username"]}), 200
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token expired."}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token."}), 401