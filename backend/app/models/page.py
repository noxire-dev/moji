from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from uuid import UUID


class PageBase(BaseModel):
    """Base page fields shared across models."""
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(default="")


class PageCreate(PageBase):
    """Schema for creating a new page."""
    pass


class PageUpdate(BaseModel):
    """Schema for updating a page. All fields optional."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = None


class Page(PageBase):
    """Full page model with all fields."""
    id: UUID
    workspace_id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

