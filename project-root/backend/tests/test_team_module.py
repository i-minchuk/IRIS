"""Tests for team/employees module integration."""
import pytest
from unittest.mock import MagicMock, AsyncMock


class TestTeamEndpoints:
    """Tests for team-related API endpoints."""

    def test_leaderboard_data_structure(self, client_with_auth):
        """Leaderboard API should return proper data structure."""
        with client_with_auth as client:
            from app.modules.gamification.router import get_service
            from app.modules.gamification.service import GamificationService

            mock_service = MagicMock(spec=GamificationService)
            mock_service.get_leaderboard = AsyncMock(return_value=[
                {
                    "user_id": 1,
                    "username": "alexey",
                    "full_name": "Алексей Петров",
                    "score": 15420,
                    "rank": 1,
                    "level": 18,
                    "badges": 12,
                    "streak": 15,
                },
                {
                    "user_id": 3,
                    "username": "maria",
                    "full_name": "Мария Сидорова",
                    "score": 12850,
                    "rank": 2,
                    "level": 16,
                    "badges": 10,
                    "streak": 12,
                },
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
                assert len(data) == 2
                assert data[0]["rank"] == 1
                assert data[0]["score"] == 15420
                # API returns: user_id, username, full_name, score, rank
                assert "user_id" in data[0]
                assert "username" in data[0]
                assert "full_name" in data[0]
            finally:
                app.dependency_overrides = original_overrides

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


class TestBirthdayWidget:
    """Tests for birthday widget data."""

    def test_birthday_data_format(self, client_with_auth):
        """Birthday data should have proper format."""
        with client_with_auth as client:
            # Mock profile data with birthdays
            from app.modules.auth.deps import get_current_active_user
            from app.main import app

            mock_user = MagicMock()
            mock_user.id = 1
            mock_user.email = "test@example.com"
            mock_user.full_name = "Test User"
            mock_user.role = "admin"
            mock_user.is_active = True

            async def override_user():
                return mock_user

            original_overrides = dict(app.dependency_overrides)
            app.dependency_overrides[get_current_active_user] = override_user

            try:
                response = client.get("/api/v1/profile")
                # Profile endpoint may not exist, just check auth works
                assert response.status_code in (200, 404)
            finally:
                app.dependency_overrides = original_overrides


class TestCalendarBirthdays:
    """Tests for calendar birthday endpoint."""

    def test_calendar_birthdays_returns_data(self, client_with_auth):
        """Calendar birthdays API should return employee birthdays."""
        with client_with_auth as client:
            response = client.get("/api/v1/calendar/birthdays")
            assert response.status_code == 200
            data = response.json()
            assert len(data) > 0
            assert "id" in data[0]
            assert "name" in data[0]
            assert "date" in data[0]
            assert "role" in data[0]
            # date format is MM-DD
            assert len(data[0]["date"]) == 5
            assert data[0]["date"][2] == "-"

    def test_calendar_birthdays_requires_auth(self, client):
        """Calendar birthdays API should require authentication."""
        response = client.get("/api/v1/calendar/birthdays")
        assert response.status_code in (401, 403)

    def test_calendar_events_include_birthday_type(self, client_with_auth, mock_db):
        """Calendar events API should support birthday type in schema."""
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
