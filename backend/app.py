from flask import Flask
from flask_cors import CORS

from models import User, Workspace, db
from routes.api import api
from routes.test import test

app = Flask(__name__)
CORS(app)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///app.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = "secret_key"
db.init_app(app)

app.register_blueprint(api)
app.register_blueprint(test)


@app.route("/")
def hello():
    return {"message": "Moji API is running!"}


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
