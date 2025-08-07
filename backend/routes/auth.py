from flask import Blueprint, request, jsonify
from models import User

auth = Blueprint("auth", __name__, url_prefix="/auth")


@auth.route("/", methods=["POST"])
def auth_home():
    return jsonify("This is MOJI Auth interface")


@auth.route("/ifuserexists", methods=["POST"])
def ifuserexists():
    data = request.json
    user = User.query.filter_by(email=data["email"]).first()
    if user:
        return jsonify({"exists": True}), 200
    return jsonify({"exists": False}), 200


@auth.route("/register", methods=["POST"])
def register():
    data = request.json
    if ifuserexists(data):
        return jsonify({"exists": True}), 200
    else:
        new_user = User(
            name=data["name"],
            email=data["email"],
            password=data["password"],
        )
        new_user.set_password(data["password"])
        new_user.save()
        return jsonify({"success": True}), 200


@auth.route("/login", methods=["POST"])
def login():
    data = request.json
    if ifuserexists(data):
        return jsonify({"success": True}), 200
