from flask import Blueprint, redirect, render_template, request, session, url_for

from models import User

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST", "GET"])
def register():
    if request.method == "GET":
        return render_template("auth/register.html")
    data = request.get_json()
    if User.get_by_field("email", data.get("email")):
        return redirect(url_for("auth.login"))
    try:
        user = User.create(data)
    except Exception as e:
        print(e)
        return redirect(url_for("auth.register"))
    session["user_id"] = user.id
    return redirect(url_for("index"))


@auth_bp.route("/login", methods=["POST", "GET"])
def login():
    if request.method == "GET":
        return render_template("auth/login.html")
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    user = User.get_by_field("email", email)
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
