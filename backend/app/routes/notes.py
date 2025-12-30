from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID
from typing import List

from app.dependencies import get_current_user, get_authenticated_client
from app.models.note import Note, NoteCreate, NoteUpdate
from supabase import Client

router = APIRouter(tags=["notes"])


async def verify_workspace_ownership(
    workspace_id: UUID,
    user_id: str,
    supabase: Client,
) -> bool:
    """Verify the user owns the workspace."""
    check = (
        supabase.table("workspaces")
        .select("id")
        .eq("id", str(workspace_id))
        .eq("user_id", user_id)
        .execute()
    )
    return bool(check.data)


@router.get("/workspaces/{workspace_id}/notes", response_model=List[Note])
async def get_notes(
    workspace_id: UUID,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_authenticated_client),
):
    """Get all notes in a workspace."""
    try:
        # Verify workspace ownership
        if not await verify_workspace_ownership(workspace_id, str(user.id), supabase):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workspace not found",
            )
        
        response = (
            supabase.table("notes")
            .select("*")
            .eq("workspace_id", str(workspace_id))
            .order("updated_at", desc=True)
            .execute()
        )
        return response.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch notes: {str(e)}",
        )


@router.post(
    "/workspaces/{workspace_id}/notes",
    response_model=Note,
    status_code=status.HTTP_201_CREATED,
)
async def create_note(
    workspace_id: UUID,
    note: NoteCreate,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_authenticated_client),
):
    """Create a new note in a workspace."""
    try:
        # Verify workspace ownership
        if not await verify_workspace_ownership(workspace_id, str(user.id), supabase):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workspace not found",
            )
        
        data = note.model_dump()
        data["workspace_id"] = str(workspace_id)
        
        response = supabase.table("notes").insert(data).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create note",
            )
        
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create note: {str(e)}",
        )


@router.get("/notes/{note_id}", response_model=Note)
async def get_note(
    note_id: UUID,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_authenticated_client),
):
    """Get a specific note by ID."""
    try:
        # RLS will handle ownership check through workspace
        response = (
            supabase.table("notes")
            .select("*")
            .eq("id", str(note_id))
            .single()
            .execute()
        )
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Note not found",
            )
        
        return response.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch note: {str(e)}",
        )


@router.put("/notes/{note_id}", response_model=Note)
async def update_note(
    note_id: UUID,
    note: NoteUpdate,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_authenticated_client),
):
    """Update a note."""
    try:
        # Check note exists (RLS handles ownership)
        check = (
            supabase.table("notes")
            .select("id")
            .eq("id", str(note_id))
            .execute()
        )
        
        if not check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Note not found",
            )
        
        update_data = note.model_dump(exclude_unset=True)
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update",
            )
        
        response = (
            supabase.table("notes")
            .update(update_data)
            .eq("id", str(note_id))
            .execute()
        )
        
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update note: {str(e)}",
        )


@router.delete("/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    note_id: UUID,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_authenticated_client),
):
    """Delete a note."""
    try:
        # Check note exists (RLS handles ownership)
        check = (
            supabase.table("notes")
            .select("id")
            .eq("id", str(note_id))
            .execute()
        )
        
        if not check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Note not found",
            )
        
        supabase.table("notes").delete().eq("id", str(note_id)).execute()
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete note: {str(e)}",
        )

