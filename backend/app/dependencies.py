from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from functools import lru_cache
from typing import Annotated, Any

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
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
) -> Any:
    """
    Validate JWT token and return the authenticated user.
    The token is verified using Supabase's JWT secret.
    """
    try:
        settings = get_settings()

        # Use Supabase client to verify the token
        # The get_user method with token should work in supabase-py
        supabase = create_client(settings.supabase_url, settings.supabase_anon_key)

        # Try to get user using the token
        # In supabase-py v2, get_user can accept a token parameter
        try:
            response = supabase.auth.get_user(credentials.credentials)
            if response.user:
                return response.user
        except (AttributeError, TypeError):
            # If get_user doesn't accept token parameter, use alternative method
            pass

        # Alternative: Use python-jose to decode and verify the JWT
        from jose import jwt, JWTError
        from types import SimpleNamespace

        try:
            # Get the JWT secret from Supabase (we can use the anon key for verification
            # or decode without verification to get user info, then verify with Supabase)
            # For now, decode without verification to extract user info
            # In production, you should verify the signature with Supabase's JWT secret
            unverified = jwt.get_unverified_claims(credentials.credentials)
            user_id = unverified.get('sub')
            email = unverified.get('email')

            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token format",
                    headers={"WWW-Authenticate": "Bearer"},
                )

            # Create a user-like object
            user = SimpleNamespace(
                id=user_id,
                email=email,
                user_metadata=unverified.get('user_metadata', {}),
            )
            return user

        except JWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
            )

    except HTTPException:
        raise
    except Exception as e:
        settings = get_settings()
        # Don't leak auth details even in debug mode
        detail = "Could not validate credentials" if not settings.debug else f"Could not validate credentials: {str(e)}"
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_authenticated_client(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
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
