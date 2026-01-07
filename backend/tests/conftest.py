"""Pytest configuration and fixtures."""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch

from app.main import app
from app.config import get_settings


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


@pytest.fixture
def mock_user():
    """Create a mock user for testing."""
    user = Mock()
    user.id = "test-user-id"
    user.email = "test@example.com"
    return user


@pytest.fixture
def mock_supabase_client():
    """Create a mock Supabase client for testing."""
    with patch("app.dependencies.get_authenticated_client") as mock:
        mock_client = Mock()
        mock.return_value = mock_client
        yield mock_client
