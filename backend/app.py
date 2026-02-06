from flask import Flask
from flask_cors import CORS
from models import User, Workspace, db
from routes.api import api
from routes.test import test
from routes.auth import auth

app = Flask(__name__)
CORS(app)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///app.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = "secret_key"
db.init_app(app)

moji_data = {
    "name": "Moji",
    "version": "0.0.1",
    "backend_version": "0.0.1",
    "frontend_version": "0.0.1",
    "api_version": "v1",
    "instance": "ldb0",
    "author": "Noxire",
    "license": "MIT",
    "url": "https://github.com/Noxire/Moji",
}

moji_metadata = (
    f"{moji_data['name']}@{moji_data['version']}"
    f"-inst{moji_data['instance']}"
    f"-fe{moji_data['frontend_version']}"
    f"-be{moji_data['backend_version']}"
    f"-api{moji_data['api_version']}"
)
API_VERSION = "/v1"


app.register_blueprint(api, url_prefix="/v1" + api.url_prefix)
app.register_blueprint(auth, url_prefix=API_VERSION + auth.url_prefix)
# app.register_blueprint(test, url_prefix=API_VERSION + test.url_prefix)


@app.route("/")
def hello():
    return {"message": "Moji API is running!", "metadata": moji_metadata}

@app.route("/metadata")
def metadata():
    return {"metadata": moji_metadata}


if __name__ == "__main__":
    with app.app_context():
        db.create_all()

        # Create a test user and workspace for development
        if not User.query.first():
            test_user = User()
            test_user.from_dict({"name": "Noxire", "email": "nox@moji.com"})
            test_user.set_password("test123")
            test_user.save()

            # Create default "Personal" workspace
            personal_workspace = Workspace()
            personal_workspace.from_dict(
                {"name": "Personal", "description": "Your personal workspace"}
            )
            personal_workspace.user_id = test_user.id
            personal_workspace.save()

            print(f"Created test user: {test_user.email}")
            print(f"Created workspace: {personal_workspace.name}")

    app.run(debug=True, port=5000)
