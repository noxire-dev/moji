from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from uuid import UUID


class NoteBase(BaseModel):
    """Base note fields shared across models."""

    title: str = Field(..., min_length=1, max_length=100)
    content: str = Field(default="")
    tags: list[str] = Field(default_factory=list)


class NoteCreate(NoteBase):
    """Schema for creating a new note."""

    pass


class NoteUpdate(BaseModel):
    """Schema for updating a note. All fields optional."""

    title: Optional[str] = Field(None, min_length=1, max_length=100)
    content: Optional[str] = None
    tags: Optional[list[str]] = None


class Note(NoteBase):
    """Full note model with all fields."""

    id: UUID
    workspace_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
