from datetime import UTC, datetime

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    display_name = db.Column(db.String(64), nullable=False)
    handler_name = db.Column(db.String(64), nullable=False, unique=True, index=True)
    email = db.Column(db.String(128), unique=True, nullable=False, index=True)
    _password_hash = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now(UTC), nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.now(UTC),
        onupdate=datetime.now(UTC),
        nullable=False,
    )
    _last_login = db.Column(db.DateTime)
    _login_attempts = db.Column(db.Integer, default=0)
    license_id = db.Column(db.Integer, db.ForeignKey("licenses.id"), nullable=True)

    # Relationships
    projects = db.relationship(
        "Project", back_populates="user", cascade="all, delete-orphan", passive_deletes=True
    )
    todos = db.relationship("Todo", back_populates="user", cascade="all, delete-orphan", passive_deletes=True)
    notes = db.relationship("Note", back_populates="user", cascade="all, delete-orphan", passive_deletes=True)
    license = db.relationship("License", back_populates="users")


## Later on add github support
class Project(db.Model):
    __tablename__ = "projects"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), nullable=False, index=True)
    description = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now(UTC), nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.now(UTC),
        onupdate=datetime.now(UTC),
        nullable=False,
    )
    owner_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    is_active = db.Column(db.Boolean, default=True, index=True)

    # Relationships
    user = db.relationship("User", back_populates="projects")
    todos = db.relationship(
        "Todo", back_populates="project", cascade="all, delete-orphan", passive_deletes=True
    )
    notes = db.relationship(
        "Note", back_populates="project", cascade="all, delete-orphan", passive_deletes=True
    )

    # Add unique constraint for project names per user (so no two projects can have the same name per user)
    __table_args__ = (
        db.UniqueConstraint("name", "owner_id", name="uix_project_name_owner"),
    )


class Todo(db.Model):
    __tablename__ = "todos"
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(64), nullable=False, index=True)
    description = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now(UTC), nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.now(UTC),
        onupdate=datetime.now(UTC),
        nullable=False,
    )
    project_id = db.Column(
        db.Integer,
        db.ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    owner_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    is_completed = db.Column(db.Boolean, default=False, index=True)
    _completed_at = db.Column(db.DateTime)

    # Relationships
    project = db.relationship("Project", back_populates="todos", passive_deletes=True)
    user = db.relationship("User", back_populates="todos", passive_deletes=True)


class Note(db.Model):
    __tablename__ = "notes"
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(64), nullable=False, index=True)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now(UTC), nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.now(UTC),
        onupdate=datetime.now(UTC),
        nullable=False,
    )
    project_id = db.Column(
        db.Integer,
        db.ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    owner_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Relationships
    project = db.relationship("Project", back_populates="notes", passive_deletes=True)
    user = db.relationship("User", back_populates="notes", passive_deletes=True)


## Rather than a sub-model I want to test a license model first
class License(db.Model):
    __tablename__ = "licenses"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(32), nullable=False, unique=True)
    description = db.Column(db.Text, nullable=False)
    price = db.Column(db.Integer, nullable=False)
    is_active = db.Column(db.Boolean, default=True, index=True)
    max_projects = db.Column(db.Integer, nullable=False)
    max_notes = db.Column(db.Integer, nullable=False)
    max_todos = db.Column(db.Integer, nullable=False)

    # Relationships
    users = db.relationship("User", back_populates="license")

    # Add check constraints
    __table_args__ = (
        db.CheckConstraint("price >= 0", name="check_price_positive"),
        db.CheckConstraint("max_projects >= 0", name="check_max_projects_positive"),
        db.CheckConstraint("max_notes >= 0", name="check_max_notes_positive"),
        db.CheckConstraint("max_todos >= 0", name="check_max_todos_positive"),
    )

class InviteLink(db.Model):
    __tablename__ = "invite_links"
    id = db.Column(db.Integer, primary_key=True)
    link = db.Column(db.String(128), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    owner_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    is_active = db.Column(db.Boolean, default=True, index=True)

    # Relationships
    redeemer = db.relationship("User", back_populates="invite_links")
