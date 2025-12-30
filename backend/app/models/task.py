from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from uuid import UUID


class TaskBase(BaseModel):
    """Base task fields shared across models."""

    content: str = Field(..., min_length=1, max_length=500)
    done: bool = Field(default=False)
    priority: int = Field(default=0, ge=0, le=3)  # 0=none, 1=low, 2=medium, 3=high


class TaskCreate(TaskBase):
    """Schema for creating a new task."""

    pass


class TaskUpdate(BaseModel):
    """Schema for updating a task. All fields optional."""

    content: Optional[str] = Field(None, min_length=1, max_length=500)
    done: Optional[bool] = None
    priority: Optional[int] = Field(None, ge=0, le=3)


class Task(TaskBase):
    """Full task model with all fields."""

    id: UUID
    workspace_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
