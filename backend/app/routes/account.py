from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_current_user, get_supabase_admin_client
from app.exceptions import handle_exception
from app.config import get_settings

router = APIRouter(prefix="/account", tags=["account"])


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(user=Depends(get_current_user)):
    """Delete the authenticated user's account and all data."""
    try:
        admin = get_supabase_admin_client()
        admin.auth.admin.delete_user(str(user.id))
        return None
    except HTTPException:
        raise
    except Exception as e:
        settings = get_settings()
        raise handle_exception(e, "Deleting account", debug=settings.debug)
