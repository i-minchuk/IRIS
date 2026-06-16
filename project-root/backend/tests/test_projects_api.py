"""Tests for projects API endpoints."""
import pytest
from datetime import datetime, timezone
from unittest.mock import MagicMock

from app.main import app
from app.modules.auth.deps import get_current_active_user
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
def client_with_auth(mock_user):
    from fastapi.testclient import TestClient

    async def override_get_current_user():
        return mock_user

    app.dependency_overrides[get_current_active_user] = override_get_current_user
    yield TestClient(app)
    app.dependency_overrides.clear()


def _make_mock_db(project=None, projects=None, refreshed_project=None):
    from sqlalchemy.ext.asyncio import AsyncSession
    from unittest.mock import AsyncMock
    mock_db = AsyncMock(spec=AsyncSession)
    mock_db.commit = AsyncMock()
    mock_db.refresh = AsyncMock()

    exec_result = MagicMock()
    exec_result.scalar_one_or_none.return_value = project
    exec_result.scalar.return_value = 0
    exec_result.scalars.return_value.all.return_value = projects or []
    exec_result.unique.return_value = exec_result

    mock_db.execute = AsyncMock(return_value=exec_result)
    
    # Track added objects for refresh
    _added_objects = []
    original_add = mock_db.add
    
    def _track_add(obj):
        _added_objects.append(obj)
        return original_add(obj)
    
    mock_db.add = _track_add
    
    # Refresh copies attributes from refreshed_project
    async def _refresh(obj):
        if refreshed_project is not None:
            for attr in ['id', 'name', 'code', 'status', 'stage']:
                if hasattr(refreshed_project, attr):
                    setattr(obj, attr, getattr(refreshed_project, attr))
    
    mock_db.refresh = _refresh
    
    return mock_db


class TestListProjects:
    def test_list_projects(self, client_with_auth):
        with client_with_auth as client:
            mock_project = MagicMock()
            mock_project.id = 1
            mock_project.name = "Project A"
            mock_project.code = "PRJ-A"
            mock_project.customer_name = "Customer A"
            mock_project.contract_number = None
            mock_project.stage = "draft"
            mock_project.status = "draft"
            mock_project.created_at = datetime.now(timezone.utc)
            
            mock_db = _make_mock_db(projects=[mock_project])

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.get("/api/v1/projects")
                assert response.status_code == 200
                data = response.json()
                assert "items" in data
                assert len(data["items"]) == 1
                assert data["items"][0]["name"] == "Project A"
                assert data["items"][0]["code"] == "PRJ-A"
            finally:
                app.dependency_overrides.pop(get_db, None)


class TestCreateProject:
    def test_create_project(self, client_with_auth):
        with client_with_auth as client:
            refreshed = MagicMock()
            refreshed.id = 1
            refreshed.name = "New Project"
            refreshed.code = "NEW-01"
            refreshed.status = "draft"
            refreshed.stage = None
            mock_db = _make_mock_db(refreshed_project=refreshed)

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.post(
                    "/api/v1/projects",
                    json={"name": "New Project", "code": "NEW-01"},
                )
                assert response.status_code == 200
                data = response.json()
                assert data["name"] == "New Project"
                assert data["code"] == "NEW-01"
            finally:
                app.dependency_overrides.pop(get_db, None)


class TestGetProject:
    def test_get_project_success(self, client_with_auth):
        with client_with_auth as client:
            proj = MagicMock()
            proj.id = 1
            proj.name = "Project A"
            proj.code = "PRJ-A"
            proj.customer_name = "Customer"
            proj.contract_number = "CN-001"
            proj.stage = "draft"
            proj.status = "draft"
            proj.variables = {}
            proj.created_at = datetime.now(timezone.utc)
            proj.stages = []
            mock_db = _make_mock_db(project=proj)

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.get("/api/v1/projects/1")
                assert response.status_code == 200
                data = response.json()
                assert data["name"] == "Project A"
                assert data["code"] == "PRJ-A"
            finally:
                app.dependency_overrides.pop(get_db, None)

    def test_get_project_not_found(self, client_with_auth):
        with client_with_auth as client:
            mock_db = _make_mock_db(project=None)

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.get("/api/v1/projects/999")
                assert response.status_code == 404
            finally:
                app.dependency_overrides.pop(get_db, None)
