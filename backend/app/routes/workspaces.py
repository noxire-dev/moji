from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID
from typing import List

from app.dependencies import get_current_user, get_authenticated_client
from app.models.workspace import Workspace, WorkspaceCreate, WorkspaceUpdate
from app.exceptions import handle_exception
from app.config import get_settings
from app.utils import seed_default_workspaces
from supabase import Client

router = APIRouter(prefix="/workspaces", tags=["workspaces"])


@router.get("/", response_model=List[Workspace])
async def get_workspaces(
    user=Depends(get_current_user),
    supabase: Client = Depends(get_authenticated_client),
):
    """Get all workspaces for the current user."""
    try:
        response = (
            supabase.table("workspaces")
            .select("*")
            .eq("user_id", str(user.id))
            .order("created_at", desc=False)
            .execute()
        )
        workspaces = response.data or []
        should_seed = (
            len(workspaces) == 0
            or (
                len(workspaces) == 1
                and workspaces[0].get("name") == "Personal"
                and workspaces[0].get("description") == "Your personal workspace"
            )
        )
        if should_seed:
            return seed_default_workspaces(str(user.id), supabase, workspaces)

        return workspaces
    except HTTPException:
        raise
    except Exception as e:
        settings = get_settings()
        raise handle_exception(e, "Fetching workspaces", debug=settings.debug)


@router.get("/{workspace_id}", response_model=Workspace)
async def get_workspace(
    workspace_id: UUID,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_authenticated_client),
):
    """Get a specific workspace by ID."""
    try:
        response = (
            supabase.table("workspaces")
            .select("*")
            .eq("id", str(workspace_id))
            .eq("user_id", str(user.id))
            .single()
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workspace not found",
            )

        return response.data
    except HTTPException:
        raise
    except Exception as e:
        settings = get_settings()
        raise handle_exception(e, "Fetching workspace", debug=settings.debug)


@router.post("/", response_model=Workspace, status_code=status.HTTP_201_CREATED)
async def create_workspace(
    workspace: WorkspaceCreate,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_authenticated_client),
):
    """Create a new workspace."""
    try:
        data = workspace.model_dump()
        data["user_id"] = str(user.id)

        response = supabase.table("workspaces").insert(data).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create workspace",
            )

        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        settings = get_settings()
        raise handle_exception(e, "Creating workspace", debug=settings.debug)


@router.put("/{workspace_id}", response_model=Workspace)
async def update_workspace(
    workspace_id: UUID,
    workspace: WorkspaceUpdate,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_authenticated_client),
):
    """Update a workspace."""
    try:
        # Check ownership first
        check = (
            supabase.table("workspaces")
            .select("id")
            .eq("id", str(workspace_id))
            .eq("user_id", str(user.id))
            .execute()
        )

        if not check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workspace not found",
            )

        # Update only provided fields
        update_data = workspace.model_dump(exclude_unset=True)

        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update",
            )

        response = (
            supabase.table("workspaces")
            .update(update_data)
            .eq("id", str(workspace_id))
            .execute()
        )

        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        settings = get_settings()
        raise handle_exception(e, "Updating workspace", debug=settings.debug)


@router.delete("/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workspace(
    workspace_id: UUID,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_authenticated_client),
):
    """Delete a workspace and all its tasks/notes (cascade)."""
    try:
        # Check ownership first
        check = (
            supabase.table("workspaces")
            .select("id")
            .eq("id", str(workspace_id))
            .eq("user_id", str(user.id))
            .execute()
        )

        if not check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workspace not found",
            )

        supabase.table("workspaces").delete().eq("id", str(workspace_id)).execute()

        return None
    except HTTPException:
        raise
    except Exception as e:
        settings = get_settings()
        raise handle_exception(e, "Deleting workspace", debug=settings.debug)
