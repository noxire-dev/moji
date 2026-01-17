from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID
from typing import List

from app.dependencies import get_current_user, get_authenticated_client
from app.models.task import Task, TaskCreate, TaskUpdate
from app.exceptions import handle_exception
from app.config import get_settings
from app.utils import verify_workspace_ownership, is_over_limit
from supabase import Client

router = APIRouter(tags=["tasks"])


@router.get("/workspaces/{workspace_id}/tasks", response_model=List[Task])
async def get_tasks(
    workspace_id: UUID,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_authenticated_client),
):
    """Get all tasks in a workspace."""
    try:
        # Verify workspace ownership
        if not await verify_workspace_ownership(workspace_id, str(user.id), supabase):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workspace not found",
            )

        response = (
            supabase.table("tasks")
            .select("*")
            .eq("workspace_id", str(workspace_id))
            .order("created_at", desc=False)
            .execute()
        )
        return response.data
    except HTTPException:
        raise
    except Exception as e:
        settings = get_settings()
        raise handle_exception(e, "Fetching tasks", debug=settings.debug)


@router.post(
    "/workspaces/{workspace_id}/tasks",
    response_model=Task,
    status_code=status.HTTP_201_CREATED,
)
async def create_task(
    workspace_id: UUID,
    task: TaskCreate,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_authenticated_client),
):
    """Create a new task in a workspace."""
    try:
        # Verify workspace ownership
        if not await verify_workspace_ownership(workspace_id, str(user.id), supabase):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workspace not found",
            )

        settings = get_settings()
        if is_over_limit(
            supabase,
            "tasks",
            "workspace_id",
            str(workspace_id),
            settings.max_tasks_per_workspace,
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Task limit reached for this workspace",
            )

        data = task.model_dump()
        data["workspace_id"] = str(workspace_id)

        response = supabase.table("tasks").insert(data).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create task",
            )

        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        settings = get_settings()
        raise handle_exception(e, "Creating task", debug=settings.debug)


@router.get("/tasks/{task_id}", response_model=Task)
async def get_task(
    task_id: UUID,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_authenticated_client),
):
    """Get a specific task by ID."""
    try:
        # RLS will handle ownership check through workspace
        response = (
            supabase.table("tasks")
            .select("*")
            .eq("id", str(task_id))
            .single()
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found",
            )

        return response.data
    except HTTPException:
        raise
    except Exception as e:
        settings = get_settings()
        raise handle_exception(e, "Fetching task", debug=settings.debug)


@router.put("/tasks/{task_id}", response_model=Task)
async def update_task(
    task_id: UUID,
    task: TaskUpdate,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_authenticated_client),
):
    """Update a task."""
    try:
        # Check task exists (RLS handles ownership)
        check = (
            supabase.table("tasks")
            .select("id")
            .eq("id", str(task_id))
            .execute()
        )

        if not check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found",
            )

        update_data = task.model_dump(exclude_unset=True)

        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update",
            )

        response = (
            supabase.table("tasks")
            .update(update_data)
            .eq("id", str(task_id))
            .execute()
        )

        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        settings = get_settings()
        raise handle_exception(e, "Updating task", debug=settings.debug)


@router.patch("/tasks/{task_id}/toggle", response_model=Task)
async def toggle_task(
    task_id: UUID,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_authenticated_client),
):
    """Toggle task done status. Optimized to use RLS for ownership verification."""
    try:
        # Get current state - RLS ensures we can only access tasks we own
        current = (
            supabase.table("tasks")
            .select("done")
            .eq("id", str(task_id))
            .single()
            .execute()
        )

        if not current.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found",
            )

        # Toggle the done status and return updated task in single operation
        # RLS ensures only the owner can update
        new_done = not current.data["done"]
        response = (
            supabase.table("tasks")
            .update({"done": new_done})
            .eq("id", str(task_id))
            .select()
            .single()
            .execute()
        )

        # If no data returned, task doesn't exist or RLS blocked access
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found",
            )

        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        settings = get_settings()
        raise handle_exception(e, "Toggling task", debug=settings.debug)


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: UUID,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_authenticated_client),
):
    """Delete a task."""
    try:
        # Check task exists (RLS handles ownership)
        check = (
            supabase.table("tasks")
            .select("id")
            .eq("id", str(task_id))
            .execute()
        )

        if not check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Task not found",
            )

        supabase.table("tasks").delete().eq("id", str(task_id)).execute()

        return None
    except HTTPException:
        raise
    except Exception as e:
        settings = get_settings()
        raise handle_exception(e, "Deleting task", debug=settings.debug)
