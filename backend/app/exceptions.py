"""Custom exception classes for the application."""

from fastapi import HTTPException, status
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class AppException(Exception):
    """Base exception for application errors."""

    def __init__(self, message: str, status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


def handle_exception(e: Exception, operation: str, debug: bool = False) -> HTTPException:
    """
    Convert exceptions to HTTPExceptions with sanitized error messages.

    Args:
        e: The exception to handle
        operation: Description of the operation that failed
        debug: If True, include detailed error information (for development only)

    Returns:
        HTTPException with appropriate status code and sanitized message
    """
    # Log the full error for debugging
    logger.error(f"Error in {operation}: {str(e)}", exc_info=True)

    # Determine status code based on exception type
    if isinstance(e, HTTPException):
        return e

    if isinstance(e, AppException):
        status_code = e.status_code
    else:
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR

    # Sanitize error message for production
    if debug:
        # In debug mode, include more details
        detail = f"{operation} failed: {str(e)}"
    else:
        # In production, use generic messages
        if status_code == status.HTTP_500_INTERNAL_SERVER_ERROR:
            detail = f"An internal error occurred while {operation.lower()}"
        elif status_code == status.HTTP_404_NOT_FOUND:
            detail = "Resource not found"
        elif status_code == status.HTTP_400_BAD_REQUEST:
            detail = f"Invalid request for {operation.lower()}"
        else:
            detail = f"{operation} failed"

    return HTTPException(status_code=status_code, detail=detail)
