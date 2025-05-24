import os

from flask import Flask, render_template
from flask_migrate import Migrate

from routes.api import api_bp
from routes.auth import auth_bp

app = Flask(__name__)

app.secret_key = os.urandom(24)

# Configure SQLAlchemy
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///app.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize extensions
db.init_app(app)
migrate = Migrate(app, db)

app.register_blueprint(auth_bp)
app.register_blueprint(api_bp)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/test")
def test():
    return render_template("test.html")


if __name__ == "__main__":
    app.run(debug=True)
