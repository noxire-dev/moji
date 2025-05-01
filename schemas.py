from marshmallow import Schema, ValidationError, fields, post_dump, post_load, validate
from marshmallow_sqlalchemy import SQLAlchemyAutoSchema, auto_field

from models import Note, Project, Todo, User, db


class BaseSchema(Schema):
    """Base schema with common configuration."""

    class Meta:
        ordered = True  # Maintain field order in JSON output

    def handle_error(self, error, data, **kwargs):
        """Custom error handler for validation errors."""
        if isinstance(error, ValidationError):
            return {
                "status": "error",
                "message": "Validation failed",
                "errors": error.messages,
            }
        return super().handle_error(error, data, **kwargs)


class UserSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = User
        load_instance = True
        exclude = ("_password_hash", "_last_login", "_login_attempts")
        sqla_session = db.session

    id = auto_field(dump_only=True)
    display_name = auto_field(
        required=True,
        validate=[
            validate.Length(
                min=1, max=64, error="Display name must be between 1 and 64 characters"
            ),
            validate.Regexp(
                r"^[a-zA-Z0-9\s]+$",
                error="Display name can only contain letters, numbers, and spaces",
            ),
        ],
    )
    handler_name = auto_field(
        required=True,
        validate=[
            validate.Length(
                min=1, max=64, error="Handler name must be between 1 and 64 characters"
            ),
            validate.Regexp(
                r"^[a-zA-Z0-9_]+$",
                error="Handler name can only contain letters, numbers, and underscores",
            ),
        ],
    )
    email = auto_field(
        required=True, validate=validate.Email(error="Invalid email format")
    )
    password = fields.Str(
        required=True,
        load_only=True,
        validate=[
            validate.Length(min=8, error="Password must be at least 8 characters"),
            validate.Regexp(
                r"^(?=.*[A-Za-z])(?=.*\d)",
                error="Password must contain at least one letter and one number",
            ),
        ],
    )
    created_at = auto_field(dump_only=True)
    updated_at = auto_field(dump_only=True)

    @post_load
    def hash_password(self, data, **kwargs):
        """Hash the password before saving."""
        if "password" in data:
            data["_password_hash"] = data.pop("password")
        return data


class ProjectSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Project
        load_instance = True
        exclude = ("_last_modified",)
        sqla_session = db.session

    id = auto_field(dump_only=True)
    name = auto_field(
        required=True,
        validate=validate.Length(
            min=1, max=32, error="Project name must be between 1 and 32 characters"
        ),
    )
    description = auto_field(required=True)
    created_at = auto_field(dump_only=True)
    updated_at = auto_field(dump_only=True)
    owner_id = auto_field(required=True)
    is_active = auto_field(default=True)

    # Include nested relationships
    todos = fields.Nested("TodoSchema", many=True, exclude=("project",), dump_only=True)
    notes = fields.Nested("NoteSchema", many=True, exclude=("project",), dump_only=True)

    @post_dump
    def add_links(self, data, **kwargs):
        """Add HATEOAS links to the response."""
        data["links"] = {
            "self": f"/api/projects/{data['id']}",
            "todos": f"/api/projects/{data['id']}/todos",
            "notes": f"/api/projects/{data['id']}/notes",
        }
        return data


class TodoSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Todo
        load_instance = True
        exclude = ("_completed_at",)
        sqla_session = db.session

    id = auto_field(dump_only=True)
    title = auto_field(
        required=True,
        validate=validate.Length(
            min=1, max=32, error="Todo title must be between 1 and 32 characters"
        ),
    )
    description = auto_field(required=True)
    created_at = auto_field(dump_only=True)
    updated_at = auto_field(dump_only=True)
    project_id = auto_field(required=True)
    owner_id = auto_field(required=True)
    is_completed = auto_field(default=False)

    # Include nested project
    project = fields.Nested("ProjectSchema", exclude=("todos", "notes"), dump_only=True)

    @post_dump
    def add_links(self, data, **kwargs):
        """Add HATEOAS links to the response."""
        data["links"] = {
            "self": f"/api/todos/{data['id']}",
            "project": f"/api/projects/{data['project_id']}",
        }
        return data


class NoteSchema(SQLAlchemyAutoSchema):
    class Meta:
        model = Note
        load_instance = True
        exclude = ("_last_modified",)
        sqla_session = db.session

    id = auto_field(dump_only=True)
    title = auto_field(
        required=True,
        validate=validate.Length(
            min=1, max=32, error="Note title must be between 1 and 32 characters"
        ),
    )
    content = auto_field(required=True)
    created_at = auto_field(dump_only=True)
    updated_at = auto_field(dump_only=True)
    project_id = auto_field(required=True)
    owner_id = auto_field(required=True)

    # Include nested project
    project = fields.Nested("ProjectSchema", exclude=("todos", "notes"), dump_only=True)

    @post_dump
    def add_links(self, data, **kwargs):
        """Add HATEOAS links to the response."""
        data["links"] = {
            "self": f"/api/notes/{data['id']}",
            "project": f"/api/projects/{data['project_id']}",
        }
        return data


# Create instances of the schemas
user_schema = UserSchema()
users_schema = UserSchema(many=True)

project_schema = ProjectSchema()
projects_schema = ProjectSchema(many=True)

todo_schema = TodoSchema()
todos_schema = TodoSchema(many=True)

note_schema = NoteSchema()
notes_schema = NoteSchema(many=True)
