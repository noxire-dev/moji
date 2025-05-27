from flask import (
    Blueprint,
    flash,
    redirect,
    render_template,
    request,
    session,
    url_for,
)

from models import User
from utils import delete_cookie, get_cookie, set_cookie

auth_bp = Blueprint("auth", __name__)


@auth_bp.before_app_request
def check_auth():
    """
    Middleware to check if a user is authenticated.
    Auto-login if valid cookie is present.
    """
    # Skip for login/registration routes and static files
    if request.endpoint and (
        request.endpoint.startswith("auth.") or request.endpoint.startswith("static")
    ):
        return

    # Check if user is already in session
    if "user_id" in session:
        return

    # Check for authentication cookie
    user_public_id = get_cookie("puidx1motto")
    if user_public_id:
        user = User.get_by_public_id(user_public_id)
        if user:
            # Set session data
            session["user_id"] = user.id
            session["user_public_id"] = user.public_id
            session["display_name"] = user.display_name
            session["username"] = user.username
            user.successful_login()
            return


@auth_bp.route("/register", methods=["POST", "GET"])
def register():
    if request.method == "GET":
        return render_template("auth/register.html")
    if request.method == "POST":
        data = request.form
        print(data)
        print(data.get("email"))
        print(data.get("username"))
        print(data.get("password"))
        cluster_data = {
            "email": data.get("email"),
            "username": data.get("username"),
            "password": data.get("password"),
        }
        if User.get_by_field("email", data.get("email")):
            flash("User already exists", "error")
            return redirect(url_for("auth.register"))
        try:
            user = User.create(**cluster_data)
        except Exception as e:
            print(e)
            flash("Something went wrong", "error")
            return redirect(url_for("auth.register"))
        session["user_id"] = user.id
        session["user_public_id"] = user.public_id
        session["display_name"] = user.display_name
        session["username"] = user.username
        user.successful_login()
        return redirect(url_for("index"))


@auth_bp.route("/login", methods=["POST", "GET"])
def login():
    if request.method == "GET":
        return render_template("auth/login.html")
    data = request.form
    email = data.get("email")
    password = data.get("password")
    print(f"Login attempt for email: {email}")  # Debug log
    user = User.get_by_field("email", email)
    if not user or not user.check_password(password):
        flash("Invalid email or password", "error")
        return redirect(url_for("auth.login"))

    session["user_id"] = user.id
    session["user_public_id"] = user.public_id
    session["display_name"] = user.display_name
    session["username"] = user.username
    user.successful_login()

    # Set cookie and return the response
    response = set_cookie(
        name="puidx1motto",
        value=user.public_id,
    )
    flash(f"Login successful {session['username']}", "success")
    return response


@auth_bp.route("/logout")
def logout():
    session.clear()
    return delete_cookie("puidx1motto")


@auth_bp.route("/forgot-password", methods=["POST", "GET"])
def forgot_password():
    if request.method == "GET":
        return render_template("auth/forgot_password.html")
    data = request.get_json()
    email = data.get("email")
    user = User.query.filter_by(email=email).first()
    if not user:
        return redirect(url_for("auth.forgot_password"))
