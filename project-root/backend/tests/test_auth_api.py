"""Tests for auth API endpoints."""
import pytest
from unittest.mock import MagicMock, patch
from datetime import timedelta

from app.main import app
from app.modules.auth.deps import get_current_active_user
from app.modules.auth.repository import UserRepository
from app.modules.auth.schemas import UserCreate
from app.db.session import get_db


@pytest.fixture
def mock_db():
    from sqlalchemy.ext.asyncio import AsyncSession
    return MagicMock(spec=AsyncSession)


@pytest.fixture
def mock_user():
    user = MagicMock()
    user.id = 1
    user.email = "test@example.com"
    user.username = "testuser"
    user.full_name = "Test User"
    user.role = "engineer"
    user.is_active = True
    user.is_superuser = False
    user.hashed_password = "hashed_secret"
    return user


@pytest.fixture
def client_with_auth(mock_db, mock_user):
    async def override_get_db():
        yield mock_db

    async def override_get_current_user():
        return mock_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_active_user] = override_get_current_user
    from fastapi.testclient import TestClient
    yield TestClient(app)
    app.dependency_overrides.clear()


class TestAuthRegister:
    """Tests for POST /auth/register."""

    def test_register_success(self, client_with_auth, mock_db):
        with client_with_auth as client:
            with patch.object(UserRepository, "get_by_email", return_value=None) as mock_get, \
                 patch.object(UserRepository, "create") as mock_create:
                mock_created = MagicMock()
                mock_created.id = 1
                mock_created.email = "new@example.com"
                mock_created.full_name = "New User"
                mock_created.role = "engineer"
                mock_created.is_active = True
                mock_create.return_value = mock_created

                response = client.post(
                    "/api/v1/auth/register",
                    json={"email": "new@example.com", "password": "secret123", "full_name": "New User"},
                )
                assert response.status_code == 200
                data = response.json()
                assert data["email"] == "new@example.com"
                assert data["full_name"] == "New User"
                mock_get.assert_awaited_once_with(email="new@example.com")
                mock_create.assert_awaited_once()

    def test_register_duplicate_email(self, client_with_auth, mock_db, mock_user):
        with client_with_auth as client:
            with patch.object(UserRepository, "get_by_email", return_value=mock_user):
                response = client.post(
                    "/api/v1/auth/register",
                    json={"email": "test@example.com", "password": "secret123", "full_name": "Test User"},
                )
                assert response.status_code == 400
                assert "already exists" in response.json()["detail"]


class TestAuthLogin:
    """Tests for POST /auth/login."""

    def test_login_success(self, client_with_auth, mock_user):
        with client_with_auth as client:
            with patch.object(UserRepository, "get_by_email", return_value=mock_user), \
                 patch("app.modules.auth.router.security.verify_password", return_value=True), \
                 patch("app.modules.auth.router.security.create_access_token", return_value="access_123"), \
                 patch("app.modules.auth.router.security.create_refresh_token", return_value="refresh_456"):
                response = client.post(
                    "/api/v1/auth/login",
                    json={"email": "test@example.com", "password": "secret123"},
                )
                assert response.status_code == 200
                data = response.json()
                assert data["access_token"] == "access_123"
                assert data["refresh_token"] == "refresh_456"
                assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client_with_auth, mock_user):
        with client_with_auth as client:
            with patch.object(UserRepository, "get_by_email", return_value=mock_user), \
                 patch("app.modules.auth.router.security.verify_password", return_value=False):
                response = client.post(
                    "/api/v1/auth/login",
                    json={"email": "test@example.com", "password": "wrong"},
                )
                assert response.status_code == 401
                assert "Incorrect" in response.json()["detail"]

    def test_login_user_not_found(self, client_with_auth):
        with client_with_auth as client:
            with patch.object(UserRepository, "get_by_email", return_value=None):
                response = client.post(
                    "/api/v1/auth/login",
                    json={"email": "nobody@example.com", "password": "secret123"},
                )
                assert response.status_code == 401


class TestAuthRefresh:
    """Tests for POST /auth/refresh."""

    def test_refresh_success(self, client_with_auth, mock_user):
        with client_with_auth as client:
            with patch("jose.jwt.decode", return_value={"sub": "1", "type": "refresh"}), \
                 patch.object(UserRepository, "get_by_id", return_value=mock_user), \
                 patch("app.modules.auth.router.security.create_access_token", return_value="new_access"), \
                 patch("app.modules.auth.router.security.create_refresh_token", return_value="new_refresh"):
                response = client.post(
                    "/api/v1/auth/refresh",
                    json={"refresh_token": "valid.refresh.token"},
                )
                assert response.status_code == 200
                data = response.json()
                assert data["access_token"] == "new_access"
                assert data["refresh_token"] == "new_refresh"

    def test_refresh_invalid_token(self, client_with_auth):
        with client_with_auth as client:
            from jose.exceptions import JWTError
            with patch("jose.jwt.decode", side_effect=JWTError("bad token")):
                response = client.post(
                    "/api/v1/auth/refresh",
                    json={"refresh_token": "bad.token"},
                )
                assert response.status_code == 401


class TestAuthMe:
    """Tests for GET /auth/me."""

    def test_me_returns_current_user(self, client_with_auth, mock_user):
        with client_with_auth as client:
            response = client.get("/api/v1/auth/me")
            assert response.status_code == 200
            data = response.json()
            assert data["email"] == mock_user.email
            assert data["id"] == mock_user.id
