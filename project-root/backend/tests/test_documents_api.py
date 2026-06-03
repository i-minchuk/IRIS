"""Tests for documents API endpoints."""
import pytest
from datetime import datetime, timezone
from unittest.mock import MagicMock, AsyncMock, patch

from app.main import app
from app.modules.auth.deps import get_current_active_user
from app.db.session import get_db, get_db_read_only
from app.modules.documents.deps import get_document_service


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
def mock_doc(mock_user):
    doc = MagicMock()
    doc.id = 1
    doc.number = "DOC-001"
    doc.name = "Test Document"
    doc.doc_type = "KM"
    doc.status = "draft"
    doc.crs_code = None
    doc.crs_approved_date = None
    doc.content = {"body": "<p>hello</p>"}
    doc.variables_snapshot = {}
    doc.ai_classified_type = None
    doc.ai_confidence = None
    doc.author_id = mock_user.id
    doc.project_id = 1
    doc.section_id = None
    doc.locked_by_id = None
    doc.locked_at = None
    doc.locked_by = None
    doc.created_at = datetime.now(timezone.utc)
    doc.revisions = []
    doc.remarks = []
    return doc


@pytest.fixture
def client_with_auth(mock_user):
    from fastapi.testclient import TestClient

    async def override_get_current_user():
        return mock_user

    app.dependency_overrides[get_current_active_user] = override_get_current_user
    yield TestClient(app)
    app.dependency_overrides.clear()


def _make_mock_db(doc=None, docs=None, user_doc=None):
    from sqlalchemy.ext.asyncio import AsyncSession
    from datetime import datetime, timezone
    mock_db = AsyncMock(spec=AsyncSession)
    mock_db.commit = AsyncMock()

    async def refresh_side_effect(obj, *args, **kwargs):
        # Simulate DB assigning id and timestamps after insert
        if getattr(obj, "id", None) is None:
            obj.id = 42
        if getattr(obj, "created_at", None) is None:
            obj.created_at = datetime.now(timezone.utc)
        if getattr(obj, "updated_at", None) is None:
            obj.updated_at = datetime.now(timezone.utc)

    mock_db.refresh = AsyncMock(side_effect=refresh_side_effect)

    doc_result = MagicMock()
    doc_result.scalar_one_or_none.return_value = doc
    doc_result.scalars.return_value.all.return_value = docs or []
    doc_result.unique.return_value = doc_result

    user_result = MagicMock()
    user_result.scalar_one_or_none.return_value = user_doc or doc

    count_result = MagicMock()
    count_result.scalar.return_value = len(docs) if docs else (1 if doc else 0)

    call_count = [0]

    async def execute_side_effect(query):
        call_count[0] += 1
        # Heuristic: if query contains User table reference, return user_result
        qstr = str(query)
        if "users" in qstr.lower():
            return user_result
        if "count" in qstr.lower():
            return count_result
        return doc_result

    mock_db.execute = AsyncMock(side_effect=execute_side_effect)
    mock_db.scalar = AsyncMock(return_value=len(docs) if docs else (1 if doc else 0))
    return mock_db


class TestListDocuments:
    def test_list_documents(self, client_with_auth, mock_doc):
        with client_with_auth as client:
            mock_db = _make_mock_db(docs=[mock_doc])

            async def override_service():
                from app.modules.documents.service import DocumentService
                return DocumentService(mock_db)

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_document_service] = override_service
            app.dependency_overrides[get_db_read_only] = override_get_db
            try:
                response = client.get("/api/v1/documents")
                assert response.status_code == 200
                data = response.json()
                assert "items" in data
                assert len(data["items"]) == 1
                assert data["items"][0]["number"] == "DOC-001"
                assert data["total"] == 1
            finally:
                app.dependency_overrides.pop(get_document_service, None)
                app.dependency_overrides.pop(get_db_read_only, None)


class TestGetDocument:
    def test_get_document_success(self, client_with_auth, mock_doc, mock_user):
        with client_with_auth as client:
            mock_db = _make_mock_db(doc=mock_doc)

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.get("/api/v1/documents/1")
                assert response.status_code == 200
                data = response.json()
                assert data["number"] == "DOC-001"
                assert data.get("locked_by_user") is None
            finally:
                app.dependency_overrides.pop(get_db, None)

    def test_get_document_locked(self, client_with_auth, mock_doc, mock_user):
        with client_with_auth as client:
            locker = MagicMock()
            locker.id = 2
            locker.full_name = "Other User"
            locker.email = "other@example.com"
            mock_doc.locked_by = locker
            mock_doc.locked_by_id = 2
            mock_db = _make_mock_db(doc=mock_doc)

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.get("/api/v1/documents/1")
                assert response.status_code == 200
                data = response.json()
                assert data.get("locked_by_user", {}).get("id") == 2
            finally:
                app.dependency_overrides.pop(get_db, None)

    def test_get_document_not_found(self, client_with_auth):
        with client_with_auth as client:
            mock_db = _make_mock_db(doc=None)

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.get("/api/v1/documents/999")
                assert response.status_code == 404
            finally:
                app.dependency_overrides.pop(get_db, None)


class TestCreateDocument:
    def test_create_document(self, client_with_auth, mock_doc):
        with client_with_auth as client:
            mock_db = _make_mock_db(doc=mock_doc)

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.post(
                    "/api/v1/documents",
                    json={"number": "DOC-002", "name": "New Doc", "doc_type": "PD", "project_id": 1, "author_id": 1},
                )
                assert response.status_code == 201
                data = response.json()
                assert data["number"] == "DOC-002"
                assert data["status"] == "draft"
            finally:
                app.dependency_overrides.pop(get_db, None)


class TestLockDocument:
    def test_lock_success(self, client_with_auth, mock_doc):
        with client_with_auth as client:
            mock_db = _make_mock_db(doc=mock_doc)

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.post("/api/v1/documents/1/lock")
                assert response.status_code == 200
                data = response.json()
                assert data["locked_by_id"] == 1
                assert data["document_id"] == 1
            finally:
                app.dependency_overrides.pop(get_db, None)

    def test_lock_already_locked_by_other(self, client_with_auth, mock_doc, mock_user):
        with client_with_auth as client:
            mock_doc.locked_by_id = 99
            locker = MagicMock()
            locker.id = 99
            locker.full_name = "Another User"
            locker.email = "another@example.com"
            mock_doc.locked_by = locker
            mock_db = _make_mock_db(doc=mock_doc, user_doc=locker)

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.post("/api/v1/documents/1/lock")
                assert response.status_code == 409
                detail = response.json()["detail"]
                assert "already locked" in detail["message"]
            finally:
                app.dependency_overrides.pop(get_db, None)

    def test_lock_idempotent_same_user(self, client_with_auth, mock_doc, mock_user):
        with client_with_auth as client:
            mock_doc.locked_by_id = mock_user.id
            mock_db = _make_mock_db(doc=mock_doc)

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.post("/api/v1/documents/1/lock")
                assert response.status_code == 200
            finally:
                app.dependency_overrides.pop(get_db, None)


class TestUnlockDocument:
    def test_unlock_success(self, client_with_auth, mock_doc, mock_user):
        with client_with_auth as client:
            mock_doc.locked_by_id = mock_user.id
            mock_db = _make_mock_db(doc=mock_doc)

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.post("/api/v1/documents/1/unlock")
                assert response.status_code == 200
                data = response.json()
                assert data["locked_by_id"] is None
            finally:
                app.dependency_overrides.pop(get_db, None)

    def test_unlock_forbidden(self, client_with_auth, mock_doc):
        with client_with_auth as client:
            mock_doc.locked_by_id = 99
            mock_db = _make_mock_db(doc=mock_doc)

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.post("/api/v1/documents/1/unlock")
                assert response.status_code == 403
            finally:
                app.dependency_overrides.pop(get_db, None)


class TestSubmitForApproval:
    def test_submit_for_approval_success(self, client_with_auth, mock_doc):
        with client_with_auth as client:
            mock_db = _make_mock_db(doc=mock_doc)

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.post("/api/v1/documents/1/submit-for-approval")
                assert response.status_code == 200
                data = response.json()
                assert data["status"] == "crs_pending"
            finally:
                app.dependency_overrides.pop(get_db, None)

    def test_submit_for_approval_conflict(self, client_with_auth, mock_doc):
        with client_with_auth as client:
            mock_doc.status = "crs_pending"
            mock_db = _make_mock_db(doc=mock_doc)

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.post("/api/v1/documents/1/submit-for-approval")
                assert response.status_code == 409
            finally:
                app.dependency_overrides.pop(get_db, None)


class TestSubmitForReview:
    def test_submit_for_review_success(self, client_with_auth, mock_doc):
        with client_with_auth as client:
            mock_db = _make_mock_db(doc=mock_doc)

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.post("/api/v1/documents/1/submit-for-review")
                assert response.status_code == 200
                data = response.json()
                assert data["status"] == "in_review"
            finally:
                app.dependency_overrides.pop(get_db, None)

    def test_submit_for_review_conflict(self, client_with_auth, mock_doc):
        with client_with_auth as client:
            mock_doc.status = "approved"
            mock_db = _make_mock_db(doc=mock_doc)

            async def override_get_db():
                yield mock_db

            app.dependency_overrides[get_db] = override_get_db
            try:
                response = client.post("/api/v1/documents/1/submit-for-review")
                assert response.status_code == 409
            finally:
                app.dependency_overrides.pop(get_db, None)
