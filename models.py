import secrets
from datetime import UTC, datetime

from flask_bcrypt import Bcrypt
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
bcrypt = Bcrypt()

# TODO: Start small first with todo and notes connected to a project later on add tags and time lines and segments.


class BaseModel(db.Model):
    """Base model for all models."""

    __abstract__ = True
    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.now(UTC), nullable=False)
    updated_at = db.Column(
        db.DateTime,
        default=datetime.now(UTC),
        onupdate=datetime.now(UTC),
        nullable=False,
    )
    is_deleted = db.Column(db.Boolean, default=False, index=True)
    _when_deleted = db.Column(db.DateTime, nullable=True)
    _protected_fields = ["id", "created_at", "updated_at"]

    def save(self):
        """Save the model to the database."""
        retries = 2
        while retries > 0:
            try:
                db.session.add(self)
                db.session.commit()
                break
            except Exception as e:
                db.session.rollback()
                retries -= 1
                if retries == 0:
                    raise e
        return self

    def hard_delete(self):
        """Delete the model from the database."""
        db.session.delete(self)
        db.session.commit()

    def soft_delete(self):
        """Soft delete the model from the database."""
        self.is_deleted = True
        self.save()
        return self

    @classmethod
    def create(cls, **kwargs):
        """Create a new instance of the model with the given attributes."""
        instance = cls(**kwargs)
        instance.save()
        return instance

    @classmethod
    def restore(cls, instance):
        """Restore the model from the soft delete."""
        instance.is_deleted = False
        instance.save()
        return instance

    @classmethod
    def get_by_id(cls, id):
        """Get a model by its id."""
        return db.session.query(cls).get(id)

    @classmethod
    def get_all(cls):
        """Get all models."""
        return db.session.query(cls).all()

    @classmethod
    def get_by_field(cls, field, value):
        """Get a model by a field."""
        return db.session.query(cls).filter(getattr(cls, field) == value).first()

    @classmethod
    def get_by_fields(cls, **kwargs):
        """Get a model by multiple fields."""
        return db.session.query(cls).filter_by(**kwargs).all()

    @classmethod
    def get_by_fields_or_404(cls, **kwargs):
        """Get a model by multiple fields or raise a 404 error."""
        return db.session.query(cls).filter_by(**kwargs).first_or_404()

    @classmethod
    def to_dict(cls, instance):
        """Convert the model to a dictionary."""
        return {c.name: getattr(instance, c.name) for c in cls.__table__.columns}

    @staticmethod
    def update(instance, **kwargs):
        """Update the model with validation."""
        for key, value in kwargs.items():
            if key in instance._protected_fields or key.startswith("_"):
                raise ValueError(f"Cannot update protected or private field: {key}")
            if not hasattr(instance, key):
                raise ValueError(
                    f"Field {key} does not exist on model {instance.__class__.__name__}"
                )
            setattr(instance, key, value)
        return instance.save()


class User(BaseModel):
    """User model for authentication and ownership."""

    __tablename__ = "users"
    public_id = db.Column(
        db.String(128),
        default=lambda: secrets.token_urlsafe(16),
        nullable=False,
        unique=True,
        index=True,
    )
    username = db.Column(db.String(64), nullable=False, unique=True, index=True)
    display_name = db.Column(db.String(64), nullable=False)
    email = db.Column(db.String(128), unique=True, nullable=False, index=True)
    _password_hash = db.Column(db.String(128), nullable=False)
    _last_login = db.Column(db.DateTime)
    _login_attempts = db.Column(db.Integer, default=0)
    license_id = db.Column(db.Integer, db.ForeignKey("licenses.id"), nullable=True)

    _protected_fields = BaseModel._protected_fields + [
        "public_id",
        "username",
        "display_name",
        "email",
    ]

    def check_password(self, password):
        """Check the password for the user."""
        return bcrypt.check_password_hash(self._password_hash, password)

    def set_password(self, password):
        """Set the password for the user."""
        self._password_hash = bcrypt.generate_password_hash(password).decode("utf-8")
        return self

    def change_email(self, email, password):
        """Change the email for the user."""
        if not self.check_password(password):
            raise ValueError("Invalid password")
        self.email = email
        return self

    @classmethod
    def create(cls, **kwargs):
        """Create a new user with password hashing."""
        # Extract password from kwargs before creating instance
        password = kwargs.pop("password", None)

        # Call the parent class's create method
        instance = super().create(**kwargs)

        # Set password if provided
        if password:
            instance.set_password(password)
            instance.save()

        return instance

    # Relationships
    projects = db.relationship(
        "Project",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    todos = db.relationship(
        "Todo",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    notes = db.relationship(
        "Note",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    license = db.relationship("License", back_populates="users")


class Project(BaseModel):
    """Project model for organizing todos and notes."""

    __tablename__ = "projects"
    name = db.Column(db.String(64), nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    owner_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Relationships
    user = db.relationship("User", back_populates="projects")
    todos = db.relationship(
        "Todo",
        back_populates="project",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    notes = db.relationship(
        "Note",
        back_populates="project",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    # Add unique constraint for project names per user
    __table_args__ = (
        db.UniqueConstraint("name", "owner_id", name="uix_project_name_owner"),
    )

    _protected_fields = BaseModel._protected_fields + ["owner_id"]

    def remove_todo(self, todo_id):
        """Remove a todo from the project."""
        todo = Todo.get_by_id(todo_id)
        if not todo:
            raise ValueError("Todo not found")
        todo.soft_delete()
        return todo

    def remove_note(self, note_id):
        """Remove a note from the project."""
        note = Note.get_by_id(note_id)
        if not note:
            raise ValueError("Note not found")
        note.soft_delete()
        return note

    def add_todo(self, title, description=None):
        """Add a todo to the project."""
        todo = Todo(
            title=title,
            description=description,
            project_id=self.id,
            owner_id=self.owner_id,
        )
        todo.save()
        return todo

    def add_note(self, title, content):
        """Add a note to the project."""
        note = Note(
            title=title,
            content=content,
            project_id=self.id,
            owner_id=self.owner_id,
        )
        note.save()
        return note


class Todo(BaseModel):
    """Todo model for task management."""

    __tablename__ = "todos"
    title = db.Column(db.String(64), nullable=False, index=True)
    description = db.Column(db.Text, nullable=True, index=True)
    due_date = db.Column(db.DateTime, nullable=True, index=True)
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

    _protected_fields = BaseModel._protected_fields + ["project_id", "owner_id"]

    is_completed = db.Column(db.Boolean, default=False, index=True)
    _completed_at = db.Column(db.DateTime)

    # Relationships
    project = db.relationship("Project", back_populates="todos", passive_deletes=True)
    user = db.relationship("User", back_populates="todos", passive_deletes=True)

    def mark_completed(self):
        """Mark a todo as completed."""
        self.is_completed = True
        self._completed_at = datetime.now(UTC)
        self.save()
        return self

    def mark_incomplete(self):
        """Mark a todo as incomplete."""
        self.is_completed = False
        self._completed_at = None
        self.save()
        return self

    def has_description(self):
        """Check if this todo has a non-empty description."""
        return bool(self.description and self.description.strip())

    @property
    def status(self):
        """Check if this todo is completed."""
        return "completed" if self.is_completed else "incomplete"


# todo model with X amount of repetitions like you need to do it 3 times
class TodoRepetition(Todo):
    """Todo model with X amount of repetitions."""

    __tablename__ = "todo_repetitions"
    repetitions = db.Column(db.Integer, nullable=False)
    current_repetition = db.Column(db.Integer, nullable=False)

    def mark_completed(self):
        """Mark a todo as completed."""
        if self.current_repetition >= self.repetitions:
            self.is_completed = True
            self._completed_at = datetime.now(UTC)
            self.save()
            return self
        else:
            self.current_repetition += 1
            self.save()
            return self


class Note(BaseModel):
    """Note model for storing text content."""

    __tablename__ = "notes"
    title = db.Column(db.String(64), nullable=False, index=True)
    content = db.Column(db.Text, nullable=False)

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

    _protected_fields = BaseModel._protected_fields + [
        "project_id",
        "owner_id",
    ]

    # Relationships
    project = db.relationship("Project", back_populates="notes", passive_deletes=True)
    user = db.relationship("User", back_populates="notes", passive_deletes=True)


# basic tag system for organizing thinking of doing a class or segment system or a timeline event hopefully
class Tag(BaseModel):
    """Tag model for organizing todos and notes."""

    __tablename__ = "tags"
    name = db.Column(db.String(64), nullable=False, index=True)
    color = db.Column(db.String(64), nullable=False, index=True)

    # Relationships
    todos = db.relationship("Todo", back_populates="tags", passive_deletes=True)
    notes = db.relationship("Note", back_populates="tags", passive_deletes=True)


# TODO: Make a time line model that can be used to organize todos and notes inside of a project.
class TimeLine(BaseModel):
    """TimeLine model for organizing todos and notes inside of a project."""

    __tablename__ = "time_lines"
    name = db.Column(db.String(64), nullable=False, index=True)
    color = db.Column(db.String(64), nullable=False, index=True)
    project_id = db.Column(
        db.Integer,
        db.ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    segments = db.relationship(
        "Segment", back_populates="timelines", passive_deletes=True
    )

    # Relationships
    todos = db.relationship("Todo", back_populates="timelines", passive_deletes=True)
    notes = db.relationship("Note", back_populates="timelines", passive_deletes=True)


# TODO: Make a segment model that can be used to organize todos and notes inside of a timeline.
class Segment(BaseModel):
    """Segment model for organizing todos and notes inside of a time line."""

    __tablename__ = "segments"
    name = db.Column(db.String(64), nullable=False, index=True)
    context = db.Column(db.String(64), nullable=False, index=True)
    color = db.Column(db.String(64), nullable=False, index=True)
    time_line_id = db.Column(
        db.Integer,
        db.ForeignKey("time_lines.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    todos = db.relationship("Todo", back_populates="segments", passive_deletes=True)
    notes = db.relationship("Note", back_populates="segments", passive_deletes=True)
    timeline = db.relationship(
        "TimeLine", back_populates="segments", passive_deletes=True
    )


## Rather than a sub-model I want to test a license model first
class License(BaseModel):
    __tablename__ = "licenses"
    name = db.Column(db.String(32), nullable=False, unique=True)
    description = db.Column(db.Text, nullable=False)
    price = db.Column(db.Integer, nullable=False)
    is_active = db.Column(db.Boolean, default=True, index=True)
    max_projects = db.Column(db.Integer, nullable=False)
    max_notes = db.Column(db.Integer, nullable=False)
    max_todos = db.Column(db.Integer, nullable=False)

    # Relationships
    users = db.relationship("User", back_populates="license")


# this was for inviting people to the Moji but can be used to invite to a link
class InviteLink(BaseModel):
    __tablename__ = "invite_links"
    link = db.Column(db.String(128), nullable=False, unique=True)
    owner_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    is_active = db.Column(db.Boolean, default=True, index=True)
    redeemer_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    _protected_fields = BaseModel._protected_fields + [
        "owner_id",
        "is_active",
        "link",
    ]

    # Relationships
    redeemer = db.relationship(
        "User", foreign_keys=[redeemer_id], backref="received_invites"
    )
    owner = db.relationship("User", foreign_keys=[owner_id], backref="created_invites")

    @classmethod
    def validate_invite(cls, link):
        """Validate an invite link."""
        return True if cls.get_by_field("link", link) else False
