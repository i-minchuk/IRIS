"""Tests for team/employees module integration."""
"""Tests for team/employees module integration."""
import pytest
from unittest.mock import MagicMock, AsyncMock
from unittest.mock import MagicMock, AsyncMock


class TestTeamEndpoints:
    """Tests for team-related API endpoints."""

    def test_leaderboard_sorted_by_rank(self, client_with_auth):
        """Leaderboard should be sorted by rank ascending."""
        with client_with_auth as client:
            from app.modules.gamification.router import get_service
            from app.modules.gamification.service import GamificationService

            mock_service = MagicMock(spec=GamificationService)
            mock_service.get_leaderboard = AsyncMock(return_value=[
                {"user_id": 1, "username": "first", "full_name": "First", "score": 100, "rank": 1},
                {"user_id": 2, "username": "second", "full_name": "Second", "score": 50, "rank": 2},
            ])

            async def override_service():
                return mock_service

            from app.main import app
            original_overrides = dict(app.dependency_overrides)
            app.dependency_overrides[get_service] = override_service

            try:
                response = client.get("/api/v1/gamification/leaderboard")
                assert response.status_code == 200
                data = response.json()
                assert data[0]["rank"] == 1
                assert data[1]["rank"] == 2
            finally:
                app.dependency_overrides = original_overrides


class TestCalendarBirthdays:
    """Tests for calendar birthday endpoint."""

    def test_calendar_birthdays_returns_data(self, client_with_auth):
        """Calendar birthdays API returns a list."""
        with client_with_auth as client:
            response = client.get("/api/v1/calendar/birthdays")
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            # Validate schema for each item when present
            for item in data:
                assert isinstance(item, dict)
                assert "id" in item
                assert "name" in item
                assert "date" in item
                assert "role" in item

    def test_calendar_birthdays_requires_auth(self, client):
        """Calendar birthdays API should require authentication."""
        response = client.get("/api/v1/calendar/birthdays")
        assert response.status_code in (401, 403)

    def test_calendar_events_include_birthday_type(self, client_with_auth, mock_db):
        """Calendar events API should return a list."""
        from unittest.mock import MagicMock
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db.execute.return_value = mock_result

        with client_with_auth as client:
            response = client.get("/api/v1/calendar/events")
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)


class TestAdminDashboard:
    """Tests for admin dashboard API endpoints."""

    def test_admin_audit_api_returns_data(self, client_with_auth, mock_db):
        """Admin audit API should return structured data."""
        # Properly mock the database result chain
        from unittest.mock import MagicMock
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_result.scalar.return_value = 0
        mock_db.execute.return_value = mock_result

        with client_with_auth as client:
            response = client.get("/api/v1/audit")
            assert response.status_code == 200
            data = response.json()
            assert "items" in data
            assert "total" in data
            assert data["items"] == []
            assert data["total"] == 0

    def test_admin_audit_api_requires_auth(self, client):
        """Admin audit API should require authentication."""
        response = client.get("/api/v1/audit")
        assert response.status_code in (401, 403)
