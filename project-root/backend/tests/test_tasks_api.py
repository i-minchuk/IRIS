"""Tests for tasks API endpoints."""
import pytest
from datetime import datetime, timezone
from unittest.mock import MagicMock, AsyncMock

from app.main import app
from app.modules.auth.deps import get_current_active_user
from app.db.session import get_db
from app.core.enums import TaskType, TaskStatus, TaskPriority


@pytest.fixture
def mock_user():
    user = MagicMock()
    user.id = 1
    user.email = "test@example.com"
    user.full_name = "Test User"
    user.role = "engineer"
    user.is_active = True
    user.is_superuser = False
    return user


@pytest.fixture
def mock_task(mock_user):
    task = MagicMock()
    task.id = 1
    task.title = "Test Task"
    task.description = "Test description"
    task.type = TaskType.PRODUCTION
    task.status = TaskStatus.NEW
    task.priority = TaskPriority.NORMAL
    task.due_date = None
    task.started_at = None
    task.completed_at = None
    task.assignee_id = None
    task.creator_id = mock_user.id
    task.project_id = 1
    task.route_id = None
    task.operation_id = None
    task.document_id = None
    task.work_center_id = None
    task.estimated_hours = None
    task.actual_hours = None
    task.percent_complete = 0
    task.task_data = {}
    task.created_at = datetime.now(timezone.utc)
    task.updated_at = datetime.now(timezone.utc)
    # Prevent MagicMock auto-creation for relationship attributes
    task.assignee = None
    task.creator = None
    task.project = None
    task.operation = None
    task.document = None
    task.work_center = None
    return task


@pytest.fixture
def client_with_auth(mock_user):
    from fastapi.testclient import TestClient

    async def override_get_current_user():
        return mock_user

    app.dependency_overrides[get_current_active_user] = override_get_current_user
    yield TestClient(app)
    app.dependency_overrides.clear()


def _make_mock_db(tasks=None, task=None, count=0):
    """Create a mock async database session for task tests."""
    from sqlalchemy.ext.asyncio import AsyncSession
    mock_db = AsyncMock(spec=AsyncSession)
    mock_db.commit = AsyncMock()
    mock_db.refresh = AsyncMock()
    mock_db.delete = AsyncMock()

    task_result = MagicMock()
    task_result.scalar_one_or_none.return_value = task
    task_result.scalars.return_value.all.return_value = tasks or []

    count_result = MagicMock()
    count_result.scalar.return_value = count

    stats_result = MagicMock()
    stats_result.all.return_value = []
    stats_result.scalar.return_value = count

    async def execute_side_effect(query):
        qstr = str(query).lower()
        # Count queries (select count)
        if "count(" in qstr:
            return count_result
        # Statistics group by queries
        if "group by" in qstr:
            return stats_result
        return task_result

    mock_db.execute = AsyncMock(side_effect=execute_side_effect)
    return mock_db


class TestListTasks:
    def test_list_tasks(self, client_with_auth, mock_task):
        with client_with_auth as client:
            mock_db = _make_mock_db(tasks=[mock_task], count=1)

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.get("/api/v1/tasks")
                assert response.status_code == 200
                data = response.json()
                assert len(data) == 1
                assert data[0]["title"] == "Test Task"
                assert data[0]["status"] == "new"
            finally:
                app.dependency_overrides.pop(get_db, None)

    def test_list_tasks_with_filters(self, client_with_auth, mock_task):
        with client_with_auth as client:
            mock_db = _make_mock_db(tasks=[mock_task], count=1)

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.get(
                    "/api/v1/tasks",
                    params={
                        "project_id": 1,
                        "status": "new",
                        "priority": "normal",
                        "type": "production",
                        "limit": 50,
                        "offset": 0,
                    },
                )
                assert response.status_code == 200
                data = response.json()
                assert len(data) == 1
            finally:
                app.dependency_overrides.pop(get_db, None)

    def test_list_tasks_overdue_only(self, client_with_auth, mock_task):
        with client_with_auth as client:
            mock_task.due_date = datetime(2020, 1, 1, tzinfo=timezone.utc)
            mock_task.status = TaskStatus.NEW
            mock_db = _make_mock_db(tasks=[mock_task], count=1)

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.get("/api/v1/tasks", params={"overdue_only": "true"})
                assert response.status_code == 200
                data = response.json()
                assert len(data) == 1
            finally:
                app.dependency_overrides.pop(get_db, None)

    def test_list_tasks_search(self, client_with_auth, mock_task):
        with client_with_auth as client:
            mock_db = _make_mock_db(tasks=[mock_task], count=1)

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.get("/api/v1/tasks", params={"search": "Test"})
                assert response.status_code == 200
                data = response.json()
                assert len(data) == 1
            finally:
                app.dependency_overrides.pop(get_db, None)


class TestGetTask:
    def test_get_task_success(self, client_with_auth, mock_task):
        with client_with_auth as client:
            mock_db = _make_mock_db(task=mock_task)

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.get("/api/v1/tasks/1")
                assert response.status_code == 200
                data = response.json()
                assert data["id"] == 1
                assert data["title"] == "Test Task"
                assert data["type"] == "production"
            finally:
                app.dependency_overrides.pop(get_db, None)

    def test_get_task_not_found(self, client_with_auth):
        with client_with_auth as client:
            mock_db = _make_mock_db(task=None)

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.get("/api/v1/tasks/999")
                assert response.status_code == 404
            finally:
                app.dependency_overrides.pop(get_db, None)


class TestCreateTask:
    def test_create_task(self, client_with_auth, mock_user):
        with client_with_auth as client:
            from app.modules.tasks.models import Task

            created_task = MagicMock(spec=Task)
            created_task.id = 42
            created_task.title = "New Task"
            created_task.description = None
            created_task.type = TaskType.PRODUCTION
            created_task.status = TaskStatus.NEW
            created_task.priority = TaskPriority.NORMAL
            created_task.due_date = None
            created_task.started_at = None
            created_task.completed_at = None
            created_task.assignee_id = None
            created_task.creator_id = mock_user.id
            created_task.project_id = 1
            created_task.route_id = None
            created_task.operation_id = None
            created_task.document_id = None
            created_task.work_center_id = None
            created_task.estimated_hours = None
            created_task.actual_hours = None
            created_task.percent_complete = 0
            created_task.task_data = {}
            created_task.created_at = datetime.now(timezone.utc)
            created_task.updated_at = datetime.now(timezone.utc)
            # Prevent MagicMock auto-creation for relationship attributes
            created_task.assignee = None
            created_task.creator = None
            created_task.project = None
            created_task.operation = None
            created_task.document = None
            created_task.work_center = None

            mock_db = _make_mock_db(task=created_task)

            def add_side_effect(obj):
                obj.id = 42
                obj.status = TaskStatus.NEW
                obj.percent_complete = 0
                obj.created_at = datetime.now(timezone.utc)
                obj.updated_at = datetime.now(timezone.utc)

            mock_db.add = MagicMock(side_effect=add_side_effect)

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.post(
                    "/api/v1/tasks",
                    json={
                        "title": "New Task",
                        "project_id": 1,
                        "type": "production",
                        "priority": "normal",
                    },
                )
                assert response.status_code == 201
                data = response.json()
                assert data["title"] == "New Task"
                assert data["creator_id"] == mock_user.id
            finally:
                app.dependency_overrides.pop(get_db, None)

    def test_create_task_validation_error(self, client_with_auth):
        with client_with_auth as client:
            response = client.post(
                "/api/v1/tasks",
                json={"title": ""},  # Empty title should fail validation
            )
            assert response.status_code == 422


class TestUpdateTask:
    def test_update_task(self, client_with_auth, mock_task):
        with client_with_auth as client:
            mock_task.title = "Updated Task"
            mock_db = _make_mock_db(task=mock_task)

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.patch(
                    "/api/v1/tasks/1",
                    json={"title": "Updated Task", "status": "in_progress"},
                )
                assert response.status_code == 200
                data = response.json()
                assert data["title"] == "Updated Task"
            finally:
                app.dependency_overrides.pop(get_db, None)

    def test_update_task_not_found(self, client_with_auth):
        with client_with_auth as client:
            mock_db = _make_mock_db(task=None)

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.patch(
                    "/api/v1/tasks/999",
                    json={"title": "Updated Task"},
                )
                assert response.status_code == 404
            finally:
                app.dependency_overrides.pop(get_db, None)


class TestUpdateTaskStatus:
    def test_update_task_status(self, client_with_auth, mock_task):
        with client_with_auth as client:
            mock_task.status = TaskStatus.IN_PROGRESS
            mock_db = _make_mock_db(task=mock_task)

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.patch(
                    "/api/v1/tasks/1/status",
                    json={"status": "in_progress", "percent_complete": 50},
                )
                assert response.status_code == 200
                data = response.json()
                assert data["status"] == "in_progress"
            finally:
                app.dependency_overrides.pop(get_db, None)

    def test_update_task_status_not_found(self, client_with_auth):
        with client_with_auth as client:
            mock_db = _make_mock_db(task=None)

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.patch(
                    "/api/v1/tasks/999/status",
                    json={"status": "done"},
                )
                assert response.status_code == 404
            finally:
                app.dependency_overrides.pop(get_db, None)


class TestDeleteTask:
    def test_delete_task(self, client_with_auth, mock_task):
        with client_with_auth as client:
            mock_db = _make_mock_db(task=mock_task)

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.delete("/api/v1/tasks/1")
                assert response.status_code == 200
                data = response.json()
                assert data["ok"] is True
            finally:
                app.dependency_overrides.pop(get_db, None)

    def test_delete_task_not_found(self, client_with_auth):
        with client_with_auth as client:
            mock_db = _make_mock_db(task=None)

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.delete("/api/v1/tasks/999")
                assert response.status_code == 404
            finally:
                app.dependency_overrides.pop(get_db, None)


class TestTaskStatistics:
    def test_get_statistics(self, client_with_auth):
        with client_with_auth as client:
            mock_db = _make_mock_db(count=5)

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.get("/api/v1/tasks/statistics")
                assert response.status_code == 200
                data = response.json()
                assert "total" in data
                assert "by_status" in data
                assert "by_priority" in data
                assert "overdue_count" in data
                assert "assignee_load" in data
            finally:
                app.dependency_overrides.pop(get_db, None)

    def test_get_statistics_with_project_id(self, client_with_auth):
        with client_with_auth as client:
            mock_db = _make_mock_db(count=3)

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.get("/api/v1/tasks/statistics", params={"project_id": 1})
                assert response.status_code == 200
                data = response.json()
                assert data["total"] == 3
            finally:
                app.dependency_overrides.pop(get_db, None)
