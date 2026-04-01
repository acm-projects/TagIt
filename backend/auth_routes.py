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


def get_username_from_request():
    """Extract and verify the username from the Bearer token in the request."""
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.removeprefix("Bearer ").strip()
    if not token:
        return None
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload["username"]
    except jwt.InvalidTokenError:
        return None


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

    school = data.get("school", "").strip()
    if school not in ("ECS", "JSOM", "Other", ""):
        school = ""

    raw_topics = data.get("priorityTopics", [])
    priority_topics = [str(t).strip() for t in raw_topics if str(t).strip()][:20]

    users_col.insert_one({
        "username": username,
        "password": hashed,
        "school": school,
        "priorityTopics": priority_topics,
    })

    token = make_token(username)
    return jsonify({"message": "Account created successfully.", "token": token, "username": username}), 201


@auth_bp.route("/auth/preferences", methods=["GET"])
def get_preferences():
    username = get_username_from_request()
    if not username:
        return jsonify({"error": "Unauthorized."}), 401

    user = users_col.find_one({"username": username}, {"school": 1, "priorityTopics": 1})
    if not user:
        return jsonify({"error": "User not found."}), 404

    return jsonify({
        "school": user.get("school", ""),
        "priorityTopics": user.get("priorityTopics", []),
    }), 200


@auth_bp.route("/auth/preferences", methods=["PUT"])
def update_preferences():
    username = get_username_from_request()
    if not username:
        return jsonify({"error": "Unauthorized."}), 401

    data = request.json
    update = {}

    if "school" in data:
        school = data["school"].strip()
        if school not in ("ECS", "JSOM", "Other", ""):
            return jsonify({"error": "Invalid school value."}), 400
        update["school"] = school

    if "priorityTopics" in data:
        topics = data["priorityTopics"]
        if not isinstance(topics, list):
            return jsonify({"error": "priorityTopics must be an array."}), 400
        update["priorityTopics"] = [str(t).strip() for t in topics if str(t).strip()][:20]

    if not update:
        return jsonify({"error": "Nothing to update."}), 400

    users_col.update_one({"username": username}, {"$set": update})
    return jsonify({"message": "Preferences saved."}), 200


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


# OAuth token storage routes

@auth_bp.route("/auth/oauth-tokens", methods=["POST"])
def save_oauth_tokens():
    """Node backend calls this to save a user's OAuth refresh tokens."""
    username = get_username_from_request()
    if not username:
        return jsonify({"error": "Unauthorized."}), 401

    data = request.json
    # Accepts: { googleRefreshToken, msRefreshToken, googleEmail, msEmail } - any combination
    update = {}
    if "googleRefreshToken" in data:
        update["googleRefreshToken"] = data["googleRefreshToken"]
    if "msRefreshToken" in data:
        update["msRefreshToken"] = data["msRefreshToken"]
    if "googleEmail" in data:
        update["googleEmail"] = data["googleEmail"]
    if "msEmail" in data:
        update["msEmail"] = data["msEmail"]

    if not update:
        return jsonify({"error": "No tokens provided."}), 400

    users_col.update_one({"username": username}, {"$set": update})
    return jsonify({"message": "Tokens saved."}), 200


@auth_bp.route("/auth/oauth-tokens", methods=["GET"])
def get_oauth_tokens():
    """Node backend calls this to retrieve a user's stored OAuth refresh tokens."""
    username = get_username_from_request()
    if not username:
        return jsonify({"error": "Unauthorized."}), 401

    user = users_col.find_one({"username": username}, {"googleRefreshToken": 1, "msRefreshToken": 1})
    if not user:
        return jsonify({"error": "User not found."}), 404

    return jsonify({
        "googleRefreshToken": user.get("googleRefreshToken"),
        "msRefreshToken": user.get("msRefreshToken"),
    }), 200


@auth_bp.route("/auth/connected-emails", methods=["GET"])
def get_connected_emails():
    """Return the list of connected email addresses for the current user."""
    username = get_username_from_request()
    if not username:
        return jsonify({"error": "Unauthorized."}), 401

    user = users_col.find_one({"username": username}, {"googleEmail": 1, "msEmail": 1})
    if not user:
        return jsonify({"error": "User not found."}), 404

    emails = []
    if user.get("googleEmail"):
        emails.append({"provider": "google", "email": user["googleEmail"]})
    if user.get("msEmail"):
        emails.append({"provider": "microsoft", "email": user["msEmail"]})

    return jsonify({"emails": emails}), 200