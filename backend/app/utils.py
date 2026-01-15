"""Utility functions for the application."""

from uuid import UUID
from typing import List, Dict, Any, Optional
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


def seed_default_workspaces(
    user_id: str,
    supabase: Client,
    existing_workspaces: Optional[List[Dict[str, Any]]] = None,
) -> List[Dict[str, Any]]:
    """
    Seed default workspaces and welcome content for a new user.

    Returns the list of workspaces after seeding.
    """
    existing = existing_workspaces or []
    existing_names = {w.get("name") for w in existing if w.get("name")}

    defaults = [
        ("Welcome to Moji", "Start here to learn the Moji flow"),
        ("Personal", "Personal tasks, notes, and pages"),
        ("Work", "Work projects and collaboration"),
    ]

    workspaces_payload = [
        {"name": name, "description": description, "user_id": user_id}
        for name, description in defaults
        if name not in existing_names
    ]

    if workspaces_payload:
        supabase.table("workspaces").insert(workspaces_payload).execute()

    workspaces_response = (
        supabase.table("workspaces")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=False)
        .execute()
    )
    workspaces = workspaces_response.data or []

    # Find the Welcome workspace
    welcome_workspace = next((w for w in workspaces if w.get("name") == "Welcome to Moji"), None)
    if not welcome_workspace:
        return workspaces

    welcome_id = welcome_workspace["id"]

    # Starter tasks
    tasks_payload = [
        {
            "content": "Add your first task - quick, actionable, and small",
            "done": False,
            "priority": 2,
            "workspace_id": welcome_id,
        },
        {
            "content": "Use priorities to surface what matters today",
            "done": False,
            "priority": 3,
            "workspace_id": welcome_id,
        },
        {
            "content": "Mark tasks done to keep momentum visible",
            "done": False,
            "priority": 1,
            "workspace_id": welcome_id,
        },
    ]

    # Starter notes
    notes_payload = [
        {
            "title": "Quick memory",
            "content": "Wi-Fi code: MOJI-2026",
            "tags": ["example", "note"],
            "workspace_id": welcome_id,
        },
        {
            "title": "Tiny reminder",
            "content": "Sam - design review on Tuesday",
            "tags": ["people"],
            "workspace_id": welcome_id,
        },
        {
            "title": "Useful link",
            "content": "https://usemoji.app - keep handy links here",
            "tags": ["link"],
            "workspace_id": welcome_id,
        },
    ]

    # Starter pages
    pages_payload = [
        {
            "title": "Welcome to Moji",
            "content": (
                "# Welcome to Moji\n\n"
                "Moji is built for focus. Each workspace keeps a single context so your brain\n"
                "doesn't have to switch modes all day.\n\n"
                "## The flow\n"
                "- **Tasks** are small, actionable steps.\n"
                "- **Notes** are quick memory - codes, names, links.\n"
                "- **Pages** are for evolving work: plans, drafts, docs.\n"
            ),
            "workspace_id": welcome_id,
        },
        {
            "title": "Notes vs Pages",
            "content": (
                "# Notes vs Pages\n\n"
                "Notes capture short, single-purpose bits of information.\n"
                "Pages are where ideas grow over time.\n\n"
                "If it changes and expands, put it in a Page. If you just need to remember it,\n"
                "put it in a Note.\n"
            ),
            "workspace_id": welcome_id,
        },
    ]

    has_tasks = (
        supabase.table("tasks")
        .select("id")
        .eq("workspace_id", str(welcome_id))
        .limit(1)
        .execute()
    ).data
    has_notes = (
        supabase.table("notes")
        .select("id")
        .eq("workspace_id", str(welcome_id))
        .limit(1)
        .execute()
    ).data
    has_pages = (
        supabase.table("pages")
        .select("id")
        .eq("workspace_id", str(welcome_id))
        .limit(1)
        .execute()
    ).data

    if not has_tasks:
        supabase.table("tasks").insert(tasks_payload).execute()
    if not has_notes:
        supabase.table("notes").insert(notes_payload).execute()
    if not has_pages:
        supabase.table("pages").insert(pages_payload).execute()

    return workspaces
