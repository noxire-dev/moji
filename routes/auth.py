from flask import Blueprint, jsonify, request, session

from models import User, db
from schemas import UserSchema

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    user = UserSchema().load(data)
    existing_user = User.query.filter_by(email=user.email).first()
    if existing_user:
        return jsonify({"message": "User already exists"}), 400
    db.session.add(user)
    db.session.commit()
    session["user_id"] = user.id
    return jsonify({"message": "User registered successfully"}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"message": "Invalid credentials"}), 401

    session["user_id"] = user.id
    session["display_name"] = user.display_name
    session["handler_name"] = user.handler_name
    session["license"] = user.license
    return jsonify({"message": "Logged in successfully"}), 200
