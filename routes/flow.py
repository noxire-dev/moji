from flask import Blueprint, render_template

flow_bp = Blueprint("flow", __name__, url_prefix="/flow")


@flow_bp.route("/")
def flow():
    return render_template("flow/index.html")


# hub flow space now app
