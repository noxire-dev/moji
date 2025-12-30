from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID
from typing import List

from app.dependencies import get_current_user, get_authenticated_client
from app.models.task import Task, TaskCreate, TaskUpdate
from supabase import Client

router = APIRouter(tags=["tasks"])


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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch tasks: {str(e)}",
        )


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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create task: {str(e)}",
        )


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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch task: {str(e)}",
        )


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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update task: {str(e)}",
        )


@router.patch("/tasks/{task_id}/toggle", response_model=Task)
async def toggle_task(
    task_id: UUID,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_authenticated_client),
):
    """Toggle task done status."""
    try:
        # Get current status
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
        
        new_done = not current.data["done"]
        
        response = (
            supabase.table("tasks")
            .update({"done": new_done})
            .eq("id", str(task_id))
            .execute()
        )
        
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to toggle task: {str(e)}",
        )


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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete task: {str(e)}",
        )

