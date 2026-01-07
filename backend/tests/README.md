# Backend Tests

This directory contains tests for the Moji backend API.

## Running Tests

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_workspaces.py
```

## Test Structure

- `conftest.py`: Pytest fixtures and configuration
- `test_*.py`: Test files for different modules

## Writing Tests

Tests should:
- Use fixtures from `conftest.py` for common setup
- Mock external dependencies (Supabase, etc.)
- Test both success and error cases
- Verify authentication requirements
