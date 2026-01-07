"""Tests for workspace endpoints."""

import pytest
from fastapi import status
from unittest.mock import Mock, patch


def test_get_workspaces_requires_auth(client):
    """Test that workspace endpoints require authentication."""
    response = client.get("/api/v1/workspaces")
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_create_workspace_requires_auth(client):
    """Test that creating a workspace requires authentication."""
    response = client.post(
        "/api/v1/workspaces",
        json={"name": "Test Workspace", "description": "Test description"},
    )
    assert response.status_code == status.HTTP_403_FORBIDDEN


def test_health_check(client):
    """Test that health check endpoint works without auth."""
    response = client.get("/health")
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["status"] == "healthy"


def test_root_endpoint(client):
    """Test that root endpoint works without auth."""
    response = client.get("/")
    assert response.status_code == status.HTTP_200_OK
    assert "message" in response.json()
