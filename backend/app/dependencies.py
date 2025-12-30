from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from functools import lru_cache

from app.config import get_settings, Settings

security = HTTPBearer()


@lru_cache()
def get_supabase_client() -> Client:
    """Get a cached Supabase client instance."""
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_anon_key)


def get_supabase_admin_client() -> Client:
    """Get Supabase client with service role for admin operations."""
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_key)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """
    Validate JWT token and return the authenticated user.
    The token is verified by Supabase Auth.
    """
    try:
        settings = get_settings()
        # Create a client with the user's token for RLS to work
        supabase = create_client(
            settings.supabase_url, 
            settings.supabase_anon_key,
        )
        
        # Verify the token and get user
        response = supabase.auth.get_user(credentials.credentials)
        
        if not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return response.user
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_authenticated_client(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> Client:
    """
    Get a Supabase client authenticated with the user's token.
    This ensures RLS policies work correctly.
    """
    settings = get_settings()
    supabase = create_client(settings.supabase_url, settings.supabase_anon_key)
    supabase.auth.set_session(credentials.credentials, credentials.credentials)
    
    # For supabase-py v2, we need to use postgrest with auth header
    supabase.postgrest.auth(credentials.credentials)
    
    return supabase

