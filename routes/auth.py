from flask import Blueprint, redirect, render_template, request, session, url_for

from models import User, db

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST", "GET"])
def register():
    if request.method == "GET":
        return render_template("auth/register.html")
    data = request.get_json()
    existing_user = User.query.filter_by(email=data.get("email")).first()
    if existing_user:
        return redirect(url_for("login"))
    db.session.add(existing_user)
    db.session.commit()
    session["user_id"] = existing_user.id
    return redirect(url_for("index"))


@auth_bp.route("/login", methods=["POST", "GET"])
def login():
    if request.method == "GET":
        return render_template("auth/login.html")
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return redirect(url_for("auth.login"))

    session["user_id"] = user.id
    session["display_name"] = user.display_name
    session["handler_name"] = user.handler_name
    session["license"] = user.license
    return redirect(url_for("index"))


@auth_bp.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("index"))


@auth_bp.route("/forgot-password", methods=["POST", "GET"])
def forgot_password():
    if request.method == "GET":
        return render_template("auth/forgot_password.html")
    data = request.get_json()
    email = data.get("email")
    user = User.query.filter_by(email=email).first()
    if not user:
        return redirect(url_for("auth.forgot_password"))
