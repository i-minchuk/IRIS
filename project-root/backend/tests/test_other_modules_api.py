"""Tests for time-tracking, variables, analytics and resources endpoints."""
import pytest
from datetime import datetime, timezone
from unittest.mock import MagicMock, AsyncMock

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


def _make_mock_db(doc=None, docs=None, row=None):
    from sqlalchemy.ext.asyncio import AsyncSession
    mock_db = AsyncMock(spec=AsyncSession)
    mock_db.commit = AsyncMock()
    mock_db.refresh = AsyncMock()

    exec_result = MagicMock()
    exec_result.scalar_one_or_none.return_value = doc
    exec_result.scalar.return_value = 0
    exec_result.scalars.return_value.all.return_value = docs or []
    exec_result.unique.return_value = exec_result
    if row:
        exec_result.mappings.return_value.one.return_value = row
        exec_result.one_or_none.return_value = row

    mock_db.execute = AsyncMock(return_value=exec_result)
    return mock_db


class TestTimeTracking:
    def test_list_sessions(self, client_with_auth):
        with client_with_auth as client:
            sess = MagicMock()
            sess.id = 1
            sess.user_id = 1
            sess.document_id = None
            sess.project_id = None
            sess.started_at = datetime.utcnow()
            sess.ended_at = None
            sess.total_duration = 0
            sess.active_time = 0
            sess.efficiency_score = None
            mock_db = _make_mock_db(docs=[sess])

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.get("/api/v1/time-tracking/sessions")
                assert response.status_code == 200
                data = response.json()
                assert len(data) == 1
                assert data[0]["user_id"] == 1
            finally:
                app.dependency_overrides.pop(get_db, None)

    def test_start_session(self, client_with_auth):
        with client_with_auth as client:
            mock_db = _make_mock_db()

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.post(
                    "/api/v1/time-tracking/sessions/start",
                    json={"document_id": 1, "project_id": 1},
                )
                assert response.status_code == 200
                data = response.json()
                assert "id" in data
                assert "started_at" in data
            finally:
                app.dependency_overrides.pop(get_db, None)

    def test_stop_session(self, client_with_auth):
        with client_with_auth as client:
            sess = MagicMock()
            sess.id = 1
            sess.user_id = 1
            from datetime import timedelta
            sess.started_at = datetime.utcnow() - timedelta(seconds=60)
            sess.ended_at = None
            sess.total_duration = 0
            sess.active_time = 0
            sess.efficiency_score = None
            mock_db = _make_mock_db(doc=sess)

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.post(
                    "/api/v1/time-tracking/sessions/1/stop",
                    json={"active_time": 120, "edit_count": 5},
                )
                assert response.status_code == 200
                data = response.json()
                assert data["total_duration"] >= 59
            finally:
                app.dependency_overrides.pop(get_db, None)

    def test_stop_session_not_found(self, client_with_auth):
        with client_with_auth as client:
            mock_db = _make_mock_db(doc=None)

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.post(
                    "/api/v1/time-tracking/sessions/999/stop",
                    json={"active_time": 120},
                )
                assert response.status_code == 404
            finally:
                app.dependency_overrides.pop(get_db, None)

    def test_employee_analytics(self, client_with_auth):
        with client_with_auth as client:
            row = MagicMock()
            row.total_sessions = 10
            row.total_active_time = 3600
            row.avg_efficiency = 0.85
            mock_db = _make_mock_db(row=row)

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.get("/api/v1/time-tracking/analytics/employee/1")
                assert response.status_code == 200
                data = response.json()
                assert data["user_id"] == 1
                assert data["total_sessions"] == 10
            finally:
                app.dependency_overrides.pop(get_db, None)


class TestVariables:
    def test_list_variables(self, client_with_auth):
        with client_with_auth as client:
            var = MagicMock()
            var.id = 1
            var.scope = "project"
            var.project_id = 1
            var.document_id = None
            var.key = "material"
            var.value = "steel"
            var.default_value = "steel"
            var.is_computed = False
            mock_db = _make_mock_db(docs=[var])

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.get("/api/v1/variables")
                assert response.status_code == 200
                data = response.json()
                assert len(data) == 1
                assert data[0]["key"] == "material"
            finally:
                app.dependency_overrides.pop(get_db, None)

    def test_create_variable(self, client_with_auth):
        with client_with_auth as client:
            mock_db = _make_mock_db()

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.post(
                    "/api/v1/variables",
                    json={"key": "thickness", "value": "10mm", "scope": "project", "project_id": 1},
                )
                assert response.status_code == 200
                data = response.json()
                assert data["key"] == "thickness"
            finally:
                app.dependency_overrides.pop(get_db, None)

    def test_update_variable(self, client_with_auth):
        with client_with_auth as client:
            var = MagicMock()
            var.id = 1
            var.key = "thickness"
            var.value = "10mm"
            mock_db = _make_mock_db(doc=var)

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.patch(
                    "/api/v1/variables/1",
                    json={"value": "12mm"},
                )
                assert response.status_code == 200
                data = response.json()
                assert data["value"] == "12mm"
            finally:
                app.dependency_overrides.pop(get_db, None)

    def test_substitute_variable(self, client_with_auth):
        with client_with_auth as client:
            var = MagicMock()
            var.id = 1
            var.key = "material"
            var.value = "aluminum"
            var.default_value = "steel"
            mock_db = _make_mock_db(doc=var)

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.post(
                    "/api/v1/variables/1/substitute",
                    json={"template": "Material: {{material}}"},
                )
                assert response.status_code == 200
                data = response.json()
                assert "aluminum" in data["substituted"]
            finally:
                app.dependency_overrides.pop(get_db, None)


class TestAnalytics:
    def test_dashboard(self, client_with_auth):
        with client_with_auth as client:
            proj = MagicMock()
            proj.id = 1
            proj.name = "Project A"
            proj.code = "PRJ-A"
            proj.status = "draft"
            proj.created_at = datetime.now(timezone.utc)
            proj.stages = []

            user = MagicMock()
            user.id = 1
            user.email = "test@example.com"
            user.full_name = "Test User"
            user.role = "engineer"

            from sqlalchemy.ext.asyncio import AsyncSession
            mock_db = AsyncMock(spec=AsyncSession)
            mock_db.commit = AsyncMock()

            # Build a side_effect that returns different results per call
            call_count = [0]

            def make_result(scalar_val=None, scalar_one=None, mappings_row=None, scalars_all=None):
                r = MagicMock()
                if scalar_val is not None:
                    r.scalar.return_value = scalar_val
                if scalar_one is not None:
                    r.scalar_one_or_none.return_value = scalar_one
                if mappings_row is not None:
                    mr = MagicMock()
                    mr.one.return_value = mappings_row
                    r.mappings.return_value = mr
                if scalars_all is not None:
                    r.scalars.return_value.all.return_value = scalars_all
                r.unique.return_value = r
                return r

            from types import SimpleNamespace
            row = SimpleNamespace(total=5, approved=2, count=10, eff=0.8, active=3600, total_sessions=10, total_active_time=3600, avg_efficiency=0.85)

            async def execute_side_effect(query):
                call_count[0] += 1
                qstr = str(query).lower()
                if "users" in qstr and "from" in qstr and "where" not in qstr:
                    return make_result(scalars_all=[user])
                if "project" in qstr and "status" in qstr and "draft" in qstr:
                    return make_result(scalar_val=1)
                if "total" in qstr and "approved" in qstr and "case" in qstr:
                    return make_result(mappings_row=row)
                if "document" in qstr and "status" in qstr and "approved" in qstr:
                    return make_result(scalar_val=2)
                if "remark" in qstr and "severity" in qstr and "critical" in qstr:
                    return make_result(scalar_val=0)
                if "remark" in qstr and "status" in qstr and "not" in qstr:
                    return make_result(scalar_val=1)
                if "time_sessions" in qstr and "efficiency_score" in qstr:
                    return make_result(scalar_val=0.75)
                if "project" in qstr and "from" in qstr and "where" not in qstr:
                    return make_result(scalars_all=[proj])
                if "document" in qstr and "author_id" in qstr:
                    return make_result(scalar_val=3)
                if "time_sessions" in qstr and "user_id" in qstr:
                    return make_result(mappings_row=row)
                return make_result()

            mock_db.execute = AsyncMock(side_effect=execute_side_effect)

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.get("/api/v1/analytics/dashboard")
                assert response.status_code == 200
                data = response.json()
                assert "kpis" in data
                assert "scorecard" in data
                assert "team" in data
            finally:
                app.dependency_overrides.pop(get_db, None)


class TestTenders:
    def test_list_tenders(self, client_with_auth):
        with client_with_auth as client:
            tender = MagicMock()
            tender.id = 1
            tender.name = "Tender A"
            tender.customer_name = "Customer"
            tender.project_type = "KM"
            tender.status = "draft"
            tender.calculated_cost = 1000
            tender.created_at = datetime.now(timezone.utc)
            mock_db = _make_mock_db(docs=[tender])

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.get("/api/v1/tenders")
                assert response.status_code == 200
                data = response.json()
                assert len(data) == 1
                assert data[0]["name"] == "Tender A"
            finally:
                app.dependency_overrides.pop(get_db, None)

    def test_get_tender(self, client_with_auth):
        with client_with_auth as client:
            tender = MagicMock()
            tender.id = 1
            tender.name = "Tender A"
            tender.customer_name = "Customer"
            tender.project_type = "KM"
            tender.volume = 100
            tender.complexity = "medium"
            tender.standards = []
            tender.start_date = None
            tender.deadline = None
            tender.duration_months = 6
            tender.calculated_hours = None
            tender.calculated_cost = None
            tender.team_size = None
            tender.team_composition = {}
            tender.status = "draft"
            tender.created_at = datetime.now(timezone.utc)
            mock_db = _make_mock_db(doc=tender)

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.get("/api/v1/tenders/1")
                assert response.status_code == 200
                data = response.json()
                assert data["name"] == "Tender A"
            finally:
                app.dependency_overrides.pop(get_db, None)

    def test_get_tender_not_found(self, client_with_auth):
        with client_with_auth as client:
            mock_db = _make_mock_db(doc=None)

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.get("/api/v1/tenders/999")
                assert response.status_code == 404
            finally:
                app.dependency_overrides.pop(get_db, None)

    def test_create_tender(self, client_with_auth):
        with client_with_auth as client:
            mock_db = _make_mock_db()

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.post(
                    "/api/v1/tenders",
                    json={"name": "New Tender", "customer_name": "Client", "project_type": "KM"},
                )
                assert response.status_code == 200
                data = response.json()
                assert data["name"] == "New Tender"
                assert data["status"] == "draft"
            finally:
                app.dependency_overrides.pop(get_db, None)

    def test_calculate_tender(self, client_with_auth):
        with client_with_auth as client:
            tender = MagicMock()
            tender.id = 1
            tender.name = "Tender A"
            tender.project_type = "KM"
            tender.volume = 100
            tender.volume_unit = "ton"
            tender.complexity = "medium"
            tender.standards = []
            tender.duration_months = 6
            tender.calculated_hours = None
            tender.team_size = None
            tender.team_composition = {}
            mock_db = _make_mock_db(doc=tender)

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.post("/api/v1/tenders/1/calculate")
                assert response.status_code == 200
                data = response.json()
                assert data["tender_id"] == 1
                assert "total_hours" in data
                assert "team_size" in data
            finally:
                app.dependency_overrides.pop(get_db, None)


class TestResources:
    def test_get_workload(self, client_with_auth):
        with client_with_auth as client:
            user = MagicMock()
            user.id = 1
            user.email = "test@example.com"
            user.full_name = "Test User"
            user.role = "engineer"

            proj = MagicMock()
            proj.id = 1
            proj.name = "Project A"
            proj.code = "PRJ-A"

            from sqlalchemy.ext.asyncio import AsyncSession
            mock_db = AsyncMock(spec=AsyncSession)
            mock_db.commit = AsyncMock()

            def make_result(scalar_val=None, scalar_one=None, mappings_row=None, scalars_all=None):
                r = MagicMock()
                if scalar_val is not None:
                    r.scalar.return_value = scalar_val
                if scalar_one is not None:
                    r.scalar_one_or_none.return_value = scalar_one
                if mappings_row is not None:
                    mr = MagicMock()
                    mr.one.return_value = mappings_row
                    r.mappings.return_value = mr
                if scalars_all is not None:
                    r.scalars.return_value.all.return_value = scalars_all
                r.unique.return_value = r
                return r

            from types import SimpleNamespace
            row = SimpleNamespace(active=3600, eff=0.8, count=5)

            async def execute_side_effect(query):
                qstr = str(query).lower()
                if "users" in qstr and "from" in qstr and "where" not in qstr:
                    return make_result(scalars_all=[user])
                if "time_sessions" in qstr and "sum" in qstr and "efficiency" in qstr:
                    return make_result(mappings_row=row)
                if "document" in qstr and "count" in qstr and "author_id" in qstr:
                    return make_result(scalar_val=3)
                if "document" in qstr and "distinct" in qstr and "project_id" in qstr:
                    return make_result(scalar_val=1)
                if "time_sessions" in qstr and "sum" in qstr and "started_at" in qstr:
                    return make_result(scalar_val=1800)
                if "project" in qstr and "status" in qstr and "draft" in qstr:
                    return make_result(scalars_all=[proj])
                if "document" in qstr and "author_id" in qstr and "project_id" in qstr:
                    return make_result(scalars_all=[user])
                return make_result()

            mock_db.execute = AsyncMock(side_effect=execute_side_effect)

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.get("/api/v1/resources/workload")
                assert response.status_code == 200
                data = response.json()
                assert "weeks" in data
                assert "team" in data
                assert "active_projects" in data
            finally:
                app.dependency_overrides.pop(get_db, None)
