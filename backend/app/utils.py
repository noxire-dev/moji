"""Utility functions for the application."""

from uuid import UUID
from supabase import Client


async def verify_workspace_ownership(
    workspace_id: UUID,
    user_id: str,
    supabase: Client,
) -> bool:
    """
    Verify that the user owns the workspace.

    Args:
        workspace_id: The UUID of the workspace to verify
        user_id: The UUID of the user to check ownership for
        supabase: Authenticated Supabase client

    Returns:
        True if the user owns the workspace, False otherwise
    """
    check = (
        supabase.table("workspaces")
        .select("id")
        .eq("id", str(workspace_id))
        .eq("user_id", user_id)
        .execute()
    )
    return bool(check.data)
