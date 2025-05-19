from flask import Blueprint, request, jsonify, flash
from models import User, Todo, Project, Note

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


@api_bp.route("/v1/user-projects/<string:p_id>", method=["GET"])
def projects_of_user(p_id):
    user = User.get_by_field("public_id", p_id)
    if not user:
        flash("User not found!", "error")
        return jsonify({"error": "User not found"}), 404

    cleaned_prjects = user.projects
    cleaned_prjects.pop("owner_id")
