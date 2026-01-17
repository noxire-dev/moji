from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID
from typing import List

from app.dependencies import get_current_user, get_authenticated_client
from app.models.page import Page, PageCreate, PageUpdate
from app.exceptions import handle_exception
from app.config import get_settings
from app.utils import verify_workspace_ownership, is_over_limit
from supabase import Client

router = APIRouter(tags=["pages"])


@router.get("/workspaces/{workspace_id}/pages", response_model=List[Page])
async def get_pages(
    workspace_id: UUID,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_authenticated_client),
):
    """Get all pages in a workspace."""
    try:
        if not await verify_workspace_ownership(workspace_id, str(user.id), supabase):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workspace not found",
            )

        response = (
            supabase.table("pages")
            .select("*")
            .eq("workspace_id", str(workspace_id))
            .order("updated_at", desc=True)
            .execute()
        )
        return response.data
    except HTTPException:
        raise
    except Exception as e:
        settings = get_settings()
        raise handle_exception(e, "Fetching pages", debug=settings.debug)


@router.post(
    "/workspaces/{workspace_id}/pages",
    response_model=Page,
    status_code=status.HTTP_201_CREATED,
)
async def create_page(
    workspace_id: UUID,
    page: PageCreate,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_authenticated_client),
):
    """Create a new page in a workspace."""
    try:
        if not await verify_workspace_ownership(workspace_id, str(user.id), supabase):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workspace not found",
            )

        settings = get_settings()
        if is_over_limit(
            supabase,
            "pages",
            "workspace_id",
            str(workspace_id),
            settings.max_pages_per_workspace,
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Page limit reached for this workspace",
            )

        data = page.model_dump()
        data["workspace_id"] = str(workspace_id)

        response = supabase.table("pages").insert(data).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create page",
            )

        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        settings = get_settings()
        raise handle_exception(e, "Creating page", debug=settings.debug)


@router.get("/pages/{page_id}", response_model=Page)
async def get_page(
    page_id: UUID,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_authenticated_client),
):
    """Get a specific page by ID."""
    try:
        response = (
            supabase.table("pages")
            .select("*")
            .eq("id", str(page_id))
            .single()
            .execute()
        )

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Page not found",
            )

        return response.data
    except HTTPException:
        raise
    except Exception as e:
        settings = get_settings()
        raise handle_exception(e, "Fetching page", debug=settings.debug)


@router.put("/pages/{page_id}", response_model=Page)
async def update_page(
    page_id: UUID,
    page: PageUpdate,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_authenticated_client),
):
    """Update a page."""
    try:
        check = (
            supabase.table("pages")
            .select("id")
            .eq("id", str(page_id))
            .execute()
        )

        if not check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Page not found",
            )

        update_data = page.model_dump(exclude_unset=True)

        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update",
            )

        response = (
            supabase.table("pages")
            .update(update_data)
            .eq("id", str(page_id))
            .execute()
        )

        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        settings = get_settings()
        raise handle_exception(e, "Updating page", debug=settings.debug)


@router.delete("/pages/{page_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_page(
    page_id: UUID,
    user=Depends(get_current_user),
    supabase: Client = Depends(get_authenticated_client),
):
    """Delete a page."""
    try:
        check = (
            supabase.table("pages")
            .select("id")
            .eq("id", str(page_id))
            .execute()
        )

        if not check.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Page not found",
            )

        supabase.table("pages").delete().eq("id", str(page_id)).execute()

        return None
    except HTTPException:
        raise
    except Exception as e:
        settings = get_settings()
        raise handle_exception(e, "Deleting page", debug=settings.debug)
