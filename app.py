import os

from flask import Flask, render_template

from routes.auth import auth_bp

app = Flask(__name__)

app.secret_key = os.urandom(24)


app.register_blueprint(auth_bp)


@app.route("/")
def index():
    return render_template("index.html")


if __name__ == "__main__":
    app.run(debug=True)
