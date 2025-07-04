from flask import Blueprint, jsonify, request
from models import Task, User, db, Note, Workspace

api = Blueprint("api", __name__, url_prefix="/api")


@api.route("/tasks", methods=["GET"])
def fetch_tasks():
    user = User.query.filter_by(id=1).first()
    if not user:
        return jsonify({"error": "User not found"}), 404
    workspace = user.workspaces[0]
    tasks = workspace.tasks
    return jsonify([task.to_dict() for task in tasks])


@api.route("/tasks", methods=["POST"])
def create_task():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No input data provided"}), 400

        user = User.query.filter_by(id=1).first()
        if not user:
            return jsonify({"error": "User not found"}), 404

        if not user.workspaces or len(user.workspaces) == 0:
            return jsonify({"error": "User has no workspaces"}), 400

        workspace = user.workspaces[0]

        task = Task()
        task.from_dict(data)
        task.workspace_id = workspace.id

        try:
            task.save()
            return jsonify(task.to_dict()), 201
        except Exception as save_error:
            print(f"Database error while saving task: {str(save_error)}")
            db.session.rollback()
            return jsonify({"error": "Database error", "details": str(save_error)}), 500

    except Exception as e:
        print(f"Unexpected error in create_task: {str(e)}")
        return jsonify({"error": "Unexpected error", "details": str(e)}), 500


@api.route("/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    try:
        data = request.get_json()
        task = Task.query.get_or_404(task_id)
        task.update(data)
        return jsonify(task.to_dict())
    except Exception as e:
        print(f"Error updating task: {str(e)}")
        return jsonify({"error": str(e)}), 500


@api.route("/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    try:
        task = Task.query.get_or_404(task_id)
        db.session.delete(task)
        db.session.commit()
        return jsonify({"message": "Task deleted successfully"})
    except Exception as e:
        print(f"Error deleting task: {str(e)}")
        return jsonify({"error": str(e)}), 500


@api.route("/notes", methods=["GET"])
def fetch_notes():
    if user := User.query.filter_by(id=1).first():
        workspace = user.workspaces[0]
        notes = workspace.notes
        return jsonify([note.to_dict() for note in notes])
    return jsonify({"error": "User not found"}), 404


@api.route("/notes", methods=["POST"])
def create_notes():
    data = request.get_json()
    user = User.query.filter_by(id=1).first()
    print(user)
    if user and data:
        print(user)
        workspace = user.workspaces[0]
        note = Note()
        note.from_dict(data)
        note.workspace_id = workspace.id
        note.save()
        return jsonify(note.to_dict()), 201
    return jsonify({"error": "User not found or no input data provided"}), 400


@api.route("/notes/<int:note_id>", methods=["PUT"])
def update_note(note_id):
    try:
        data = request.get_json()
        note = Note.query.get_or_404(note_id)
        note.update(data)
        return jsonify(note.to_dict())
    except Exception as e:
        print(f"Error updating note: {str(e)}")
        return jsonify({"error": str(e)}), 500


@api.route("/notes/<int:note_id>", methods=["DELETE"])
def delete_note(note_id):
    try:
        if user := User.query.filter_by(id=1).first():
            workspace = user.workspaces[0]
            note = Note.query.filter_by(id=note_id, workspace_id=workspace.id).first()
            if note:
                db.session.delete(note)
                db.session.commit()
                return jsonify({"message": "Note deleted successfully"})
            else:
                return jsonify({"error": "Note not found"}), 404
        return jsonify({"error": "User not found"}), 404
    except Exception as e:
        print(f"Error deleting note: {str(e)}")
        return jsonify({"error": str(e)}), 500


@api.route("/workspaces", methods=["GET"])
def fetch_workspaces():
    if user := User.query.filter_by(id=1).first():
        workspaces = user.workspaces
        return jsonify([workspace.to_dict() for workspace in workspaces])
    return jsonify({"error": "User not found"}), 404


@api.route("/workspaces", methods=["POST"])
def create_workspace():
    data = request.get_json()
    user = User.query.filter_by(id=1).first()
    if not user or not data:
        return jsonify({"error": "User not found or no input data provided"}), 400
    workspace = Workspace()
    workspace.from_dict(data)
    workspace.user_id = user.id
    workspace.save()
    db.session.commit()
    return jsonify(workspace.to_dict()), 201
