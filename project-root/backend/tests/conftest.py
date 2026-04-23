"""Pytest fixtures and configuration for ДокПоток IRIS backend tests."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import AsyncMock, MagicMock

from app.main import app
from app.modules.auth.models import User
from app.db.session import get_db


@pytest.fixture
def mock_db():
    """Mock async database session."""
    return AsyncMock(spec=AsyncSession)


@pytest.fixture
def client(mock_db):
    """TestClient with mocked database."""
    async def override_get_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def mock_user():
    """Mock authenticated user."""
    user = MagicMock(spec=User)
    user.id = 1
    user.email = "test@example.com"
    user.username = "testuser"
    user.full_name = "Test User"
    user.role = "engineer"
    user.is_active = True
    user.is_superuser = False
    return user


@pytest.fixture
def client_with_auth(mock_db, mock_user):
    """TestClient with mocked auth and database."""
    from app.modules.auth.deps import get_current_active_user

    async def override_get_db():
        yield mock_db

    async def override_get_current_user():
        return mock_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_active_user] = override_get_current_user
    yield TestClient(app)
    app.dependency_overrides.clear()
