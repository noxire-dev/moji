from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from uuid import UUID


class WorkspaceBase(BaseModel):
    """Base workspace fields shared across models."""

    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)


class WorkspaceCreate(WorkspaceBase):
    """Schema for creating a new workspace."""

    pass


class WorkspaceUpdate(BaseModel):
    """Schema for updating a workspace. All fields optional."""

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)


class Workspace(WorkspaceBase):
    """Full workspace model with all fields."""

    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
