from datetime import datetime

from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash, generate_password_hash

db = SQLAlchemy()


class BaseModel(db.Model):
    __abstract__ = True
    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def to_dict(self):
        return {
            "id": self.id,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    def update(self, data):
        try:
            for field, value in data.items():
                setattr(self, field, value)
            db.session.commit()
            return self
        except Exception as e:
            print(f"Error in BaseModel.update: {e}")
            return None

    def delete(self):
        db.session.delete(self)
        db.session.commit()
        return self

    def save(self):
        db.session.add(self)
        db.session.commit()
        return self

    def __eq__(self, other):
        return self.id == other.id

    def __hash__(self):
        return hash(self.id)

    def __repr__(self):
        return f"<{self.__class__.__name__} {self.id}>"


class Task(BaseModel):
    content = db.Column(db.String(500), nullable=False)
    done = db.Column(db.Boolean, default=False)
    priority = db.Column(db.Integer, default=0)
    workspace_id = db.Column(db.Integer, db.ForeignKey("workspace.id"), nullable=False)
    workspace = db.relationship("Workspace", back_populates="tasks")

    def to_dict(self):
        base_dict = super().to_dict()
        return {
            **base_dict,
            "content": self.content,
            "done": self.done,
            "priority": self.priority,
        }

    def from_dict(self, data):
        self.content = data.get("content", "")
        self.done = data.get("done", False)
        self.priority = data.get("priority", 0)
        self.workspace_id = data.get("workspace_id", None)
        return self


class Note(BaseModel):
    title = db.Column(db.String(100), nullable=False)
    content = db.Column(db.Text, nullable=False)
    tags = db.Column(db.String(100), nullable=True)
    workspace_id = db.Column(db.Integer, db.ForeignKey("workspace.id"), nullable=False)
    workspace = db.relationship("Workspace", back_populates="notes")

    def to_dict(self):
        try:
            base_dict = super().to_dict()
            return {
            **base_dict,
            "title": self.title,
            "content": self.content,
                "tags": self.tags,
            }
        except Exception as e:
            print(f"Error in Note.to_dict: {e}")
            return {}

    def from_dict(self, data):
        self.title = data.get("title", "")
        self.content = data.get("content", "")
        tags_list = data.get("tags", [])
        if isinstance(tags_list, list):
            self.tags = ",".join(tags_list)
        else:
            self.tags = tags_list
        self.workspace_id = data.get("workspace_id", None)
        return self

    def __eq__(self, other):
        return self.id == other.id

    def __hash__(self):
        return hash(self.id)

    def __repr__(self):
        return f"<Note {self.id}>"


class Workspace(BaseModel):
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    tasks = db.relationship("Task", back_populates="workspace")
    notes = db.relationship("Note", back_populates="workspace")
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    user = db.relationship("User", back_populates="workspaces")

    def to_dict(self):
        base_dict = super().to_dict()
        return {
            **base_dict,
            "name": self.name,
            "description": self.description,
        }

    def from_dict(self, data):
        self.name = data.get("name", "")
        self.description = data.get("description", "")
        return self

    def __eq__(self, other):
        return self.id == other.id

    def __hash__(self):
        return hash(self.id)


class User(BaseModel):
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), nullable=False, unique=True)
    password_hash = db.Column(db.String(100), nullable=False)
    workspaces = db.relationship("Workspace", back_populates="user")

    def to_dict(self):
        base_dict = super().to_dict()
        return {
            **base_dict,
            "name": self.name,
            "email": self.email,
        }

    def from_dict(self, data):
        self.name = data.get("name", "")
        self.email = data.get("email", "")
        return self

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
