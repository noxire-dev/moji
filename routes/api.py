from flask import Blueprint, flash, jsonify, request, session

from models import Note, Project, Todo, User

api_bp = Blueprint("api", __name__, url_prefix="/api")


@api_bp.route("/v1/todos-from-project/<string:p_id>", methods=["GET"])
def get_todos_from_project(p_id):
    project = Project.get_by_public_id(p_id)
    if not project:
        flash("Project not found", "error")
        return jsonify({"error": "Project not found"}), 404
    todos = Todo.get_all_filter(project_id=project.id, is_deleted=False)
    return jsonify([todo.to_dict() for todo in todos])


@api_bp.route("/v1/notes-from-project/<string:p_id>", methods=["GET"])
def get_notes_from_project(p_id):
    project = Project.get_by_public_id(p_id)
    if not project:
        flash("Project not found", "error")
        return jsonify({"error": "Project not found"}), 404
    notes = Note.get_all_filter(project_id=project.id, is_deleted=False)
    return jsonify([note.to_dict() for note in notes])


@api_bp.route("/v1/user-from-pid/<string:p_id>", methods=["GET"])
def get_user_from_pid(p_id):
    user = User.get_by_field("public_id", p_id)
    if not user:
        flash("User not found", "error")
        return jsonify({"error": "User not found"}), 404
    return jsonify(user.get_user_dict())


@api_bp.route("/v1/user-projects/<string:p_id>", methods=["GET"])
def projects_of_user(p_id):
    user = User.get_by_field("public_id", p_id)
    if not user:
        flash("User not found!", "error")
        return jsonify({"error": "User not found"}), 404

    projects = [Project.to_dict(project) for project in user.projects]
    for project in projects:
        project.pop("owner_id", None)
    return jsonify(projects)


@api_bp.route("/v1/create-project", methods=["POST"])
def create_project():
    data = request.json
    if not data:
        flash("No data provided", "error")
        return jsonify({"error": "No data provided"}), 400
    if not data.get("name"):
        flash("Name is required", "error")
        return jsonify({"error": "Name is required"}), 400

    owner_id = session.get("user_id")
    owner_p_id = session.get("user_p_id")
    if not owner_id or not owner_p_id:
        flash("User not logged in", "error")
        return jsonify({"error": "User not logged in"}), 401

    name = data.get("name")
    description = data.get("description")

    try:
        project = Project.create(
            name=name, description=description, owner_id=owner_id, owner_p_id=owner_p_id
        )
        return jsonify(
            {
                "message": "Project created successfully",
                "project": Project.to_dict(project),
            }
        ), 201
    except Exception as e:
        flash("Error creating project", "error")
        return jsonify({"error": str(e)}), 500
