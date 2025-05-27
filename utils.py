from functools import wraps

from flask import make_response, redirect, request, session, url_for

## This file contains the utility functions for the app
## Think this like internal API for the app

## Wrappers for authentication


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Check if user is in session
        if session.get("user_id"):
            return f(*args, **kwargs)

        # Check for authentication cookie
        user_public_id = get_cookie("puidx1motto")
        if user_public_id:
            # Import here to avoid circular imports
            from models import User

            user = User.get_by_public_id(user_public_id)
            if user:
                # Set session data
                session["user_id"] = user.id
                session["user_public_id"] = user.public_id
                session["display_name"] = user.display_name
                session["username"] = user.username
                return f(*args, **kwargs)

        # No valid authentication found
        return redirect(url_for("auth.login"))

    return decorated_function


def set_cookie(name, value, max_age=2592000):
    """Set a cookie with the given name and value."""
    response = make_response(redirect(url_for("index")))
    response.set_cookie(
        key=name,
        value=value,
        max_age=max_age,  # 30 days in seconds
        path="/",
        httponly=True,
        samesite="Lax",
    )
    return response


def get_cookie(name):
    """Get a cookie value by name."""
    return request.cookies.get(name)


def delete_cookie(name):
    """Delete a cookie by setting it to expire."""
    response = make_response(redirect(url_for("index")))
    response.set_cookie(
        key=name,
        value="",
        max_age=0,
        path="/",
        httponly=True,
        samesite="Lax",
    )
    return response
