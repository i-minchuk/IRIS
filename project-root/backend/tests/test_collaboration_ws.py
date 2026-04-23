"""Tests for collaboration WebSocket endpoint."""
import pytest
from unittest.mock import MagicMock, patch, AsyncMock

from app.main import app
from app.modules.auth.deps import get_current_active_user
from app.modules.auth.repository import UserRepository
from app.db.session import get_db


@pytest.fixture
def mock_user():
    user = MagicMock()
    user.id = 1
    user.email = "test@example.com"
    user.full_name = "Test User"
    user.role = "engineer"
    user.is_active = True
    return user


@pytest.fixture
def mock_db(mock_user):
    from sqlalchemy.ext.asyncio import AsyncSession
    mock_db = AsyncMock(spec=AsyncSession)
    result_mock = MagicMock()
    result_mock.scalar_one_or_none.return_value = mock_user
    result_mock.scalars.return_value.all.return_value = []
    result_mock.unique.return_value = result_mock
    mock_db.execute = AsyncMock(return_value=result_mock)
    return mock_db


@pytest.fixture
def client_with_auth(mock_user, mock_db):
    from fastapi.testclient import TestClient

    async def override_get_current_user():
        return mock_user

    async def override_get_db():
        yield mock_db

    app.dependency_overrides[get_current_active_user] = override_get_current_user
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


class TestWebSocketConnect:
    def test_ws_no_token(self, client_with_auth):
        with client_with_auth as client:
            with pytest.raises(Exception):
                with client.websocket_connect("/ws"):
                    pass

    def test_ws_invalid_token(self, client_with_auth):
        with client_with_auth as client:
            with pytest.raises(Exception):
                with client.websocket_connect("/ws?token=invalid"):
                    pass

    def test_ws_valid_token(self, client_with_auth, mock_user):
        with client_with_auth as client:
            with patch("jose.jwt.decode", return_value={"sub": "1", "type": "access"}), \
                 patch.object(UserRepository, "get_by_id", return_value=mock_user):
                with client.websocket_connect("/ws?token=valid_token") as ws:
                    ws.send_json({"type": "ping"})
                    msg = ws.receive_json()
                    assert msg["type"] == "pong"

    def test_ws_presence_update(self, client_with_auth, mock_user):
        with client_with_auth as client:
            with patch("jose.jwt.decode", return_value={"sub": "1", "type": "access"}), \
                 patch.object(UserRepository, "get_by_id", return_value=mock_user):
                with client.websocket_connect("/ws?token=valid_token") as ws:
                    ws.send_json({"type": "presence_update", "payload": {"page": "/documents", "document_id": None}})
                    ws.send_json({"type": "ping"})
                    msg = ws.receive_json()
                    assert msg["type"] == "pong"

    def test_ws_subscribe_document(self, client_with_auth, mock_user):
        with client_with_auth as client:
            with patch("jose.jwt.decode", return_value={"sub": "1", "type": "access"}), \
                 patch.object(UserRepository, "get_by_id", return_value=mock_user):
                with client.websocket_connect("/ws?token=valid_token") as ws:
                    ws.send_json({"type": "subscribe_document", "payload": {"document_id": 1}})
                    msg = ws.receive_json()
                    assert msg["type"] == "document_subscribers"
                    assert msg["payload"]["document_id"] == 1
