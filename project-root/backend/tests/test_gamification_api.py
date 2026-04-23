"""Unit tests for gamification API endpoints."""
import pytest
from unittest.mock import MagicMock, AsyncMock
from datetime import datetime


class TestGamificationLeaderboard:
    """Tests for /api/v1/gamification/leaderboard endpoint."""

    def test_leaderboard_excludes_admins(self, client_with_auth):
        """Leaderboard should exclude admin users."""
        with client_with_auth as client:
            from app.modules.gamification.router import get_service
            from app.modules.gamification.service import GamificationService

            mock_service = MagicMock(spec=GamificationService)
            mock_service.get_leaderboard = AsyncMock(return_value=[
                {
                    "user_id": 2,
                    "username": "engineer1",
                    "full_name": "Engineer One",
                    "score": 150,
                    "rank": 1,
                }
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
                assert len(data) == 1
                assert data[0]["username"] == "engineer1"
            finally:
                app.dependency_overrides = original_overrides

    def test_leaderboard_sorted_by_score(self, client_with_auth):
        """Leaderboard should be sorted by score descending."""
        with client_with_auth as client:
            from app.modules.gamification.router import get_service
            from app.modules.gamification.service import GamificationService

            mock_service = MagicMock(spec=GamificationService)
            mock_service.get_leaderboard = AsyncMock(return_value=[
                {"user_id": 2, "username": "user2", "full_name": "User 2", "score": 200, "rank": 1},
                {"user_id": 3, "username": "user3", "full_name": "User 3", "score": 100, "rank": 2},
                {"user_id": 4, "username": "user4", "full_name": "User 4", "score": 50, "rank": 3},
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
                assert data[0]["score"] == 200
                assert data[1]["score"] == 100
                assert data[2]["score"] == 50
                assert data[0]["rank"] == 1
                assert data[1]["rank"] == 2
                assert data[2]["rank"] == 3
            finally:
                app.dependency_overrides = original_overrides


class TestGamificationProfile:
    """Tests for /api/v1/gamification/me endpoint."""

    def test_profile_includes_score_and_level(self, client_with_auth):
        """Profile should include user score and level."""
        with client_with_auth as client:
            from app.modules.gamification.router import get_service
            from app.modules.gamification.service import GamificationService

            mock_service = MagicMock(spec=GamificationService)
            mock_service.get_profile = AsyncMock(return_value={
                "score": 250,
                "xp": 500,
                "level": 3,
                "level_title": "Профессионал",
                "next_level_at": 600,
                "badges": [],
            })

            async def override_service():
                return mock_service

            from app.main import app
            original_overrides = dict(app.dependency_overrides)
            app.dependency_overrides[get_service] = override_service

            try:
                response = client.get("/api/v1/gamification/me")
                assert response.status_code == 200
                data = response.json()
                assert data["score"] == 250
                assert data["level"] == 3
                assert data["level_title"] == "Профессионал"
            finally:
                app.dependency_overrides = original_overrides

    def test_profile_includes_badges(self, client_with_auth):
        """Profile should include user badges."""
        with client_with_auth as client:
            from app.modules.gamification.router import get_service
            from app.modules.gamification.service import GamificationService

            mock_service = MagicMock(spec=GamificationService)
            mock_service.get_profile = AsyncMock(return_value={
                "score": 100,
                "xp": 200,
                "level": 2,
                "level_title": "Специалист",
                "next_level_at": 300,
                "badges": ["first_project"],
            })

            async def override_service():
                return mock_service

            from app.main import app
            original_overrides = dict(app.dependency_overrides)
            app.dependency_overrides[get_service] = override_service

            try:
                response = client.get("/api/v1/gamification/me")
                assert response.status_code == 200
                data = response.json()
                assert len(data["badges"]) == 1
                assert data["badges"][0] == "first_project"
            finally:
                app.dependency_overrides = original_overrides


class TestGamificationBadges:
    """Tests for /api/v1/gamification/badges endpoint."""

    def test_available_badges_returns_definitions(self, client_with_auth):
        """Available badges endpoint should return badge definitions."""
        with client_with_auth as client:
            response = client.get("/api/v1/gamification/badges")
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 5
            assert data[0]["id"] == "first_project"
            assert data[0]["name"] == "Первый проект"


class TestGamificationNotifications:
    """Tests for gamification notification endpoints."""

    def test_get_notifications_returns_list(self, client_with_auth):
        """Get notifications should return list of notifications."""
        with client_with_auth as client:
            from app.modules.gamification.router import get_service
            from app.modules.gamification.service import GamificationService

            mock_notif = MagicMock()
            mock_notif.id = 1
            mock_notif.type = "badge_awarded"
            mock_notif.title = "🏆 Получен бейдж"
            mock_notif.message = "Поздравляем!"
            mock_notif.is_read = False
            mock_notif.created_at = datetime(2025, 1, 1)

            mock_service = MagicMock(spec=GamificationService)
            mock_service.notif_repo = MagicMock()
            mock_service.notif_repo.get_user_notifications = AsyncMock(return_value=[mock_notif])

            async def override_service():
                return mock_service

            from app.main import app
            original_overrides = dict(app.dependency_overrides)
            app.dependency_overrides[get_service] = override_service

            try:
                response = client.get("/api/v1/gamification/notifications")
                assert response.status_code == 200
                data = response.json()
                assert len(data) == 1
                assert data[0]["type"] == "badge_awarded"
                assert data[0]["is_read"] == False
            finally:
                app.dependency_overrides = original_overrides

    def test_mark_notification_read_returns_success(self, client_with_auth):
        """Mark notification as read should return success."""
        with client_with_auth as client:
            from app.modules.gamification.router import get_service
            from app.modules.gamification.service import GamificationService

            mock_service = MagicMock(spec=GamificationService)
            mock_service.notif_repo = MagicMock()
            mock_service.notif_repo.mark_as_read = AsyncMock(return_value=True)

            async def override_service():
                return mock_service

            from app.main import app
            original_overrides = dict(app.dependency_overrides)
            app.dependency_overrides[get_service] = override_service

            try:
                response = client.post("/api/v1/gamification/notifications/1/read")
                assert response.status_code == 200
                data = response.json()
                assert data["ok"] == True
                mock_service.notif_repo.mark_as_read.assert_called_once_with(1, 1)
            finally:
                app.dependency_overrides = original_overrides

    def test_get_unread_count_returns_count(self, client_with_auth):
        """Get unread count should return count."""
        with client_with_auth as client:
            from app.modules.gamification.router import get_service
            from app.modules.gamification.service import GamificationService

            mock_service = MagicMock(spec=GamificationService)
            mock_service.notif_repo = MagicMock()
            mock_service.notif_repo.get_unread_count = AsyncMock(return_value=5)

            async def override_service():
                return mock_service

            from app.main import app
            original_overrides = dict(app.dependency_overrides)
            app.dependency_overrides[get_service] = override_service

            try:
                response = client.get("/api/v1/gamification/notifications/unread-count")
                assert response.status_code == 200
                data = response.json()
                assert data["count"] == 5
            finally:
                app.dependency_overrides = original_overrides


class TestDailyQuests:
    """Tests for daily quests endpoints."""

    def test_get_daily_quests_returns_quests(self, client_with_auth):
        """Get daily quests should return list of quests."""
        with client_with_auth as client:
            from app.modules.gamification.router import get_service
            from app.modules.gamification.service import GamificationService

            mock_quest = MagicMock()
            mock_quest.id = 1
            mock_quest.quest_type = "task_completed"
            mock_quest.title = "Заверши 3 задачи"
            mock_quest.description = "Заверши 3 задачи сегодня"
            mock_quest.target_count = 3
            mock_quest.current_count = 1
            mock_quest.reward_points = 10
            mock_quest.reward_xp = 20
            mock_quest.is_completed = False
            mock_quest.completed_at = None

            mock_service = MagicMock(spec=GamificationService)
            mock_service.quest_repo = MagicMock()
            mock_service.quest_repo.get_user_daily_quests = AsyncMock(return_value=[mock_quest])

            async def override_service():
                return mock_service

            from app.main import app
            original_overrides = dict(app.dependency_overrides)
            app.dependency_overrides[get_service] = override_service

            try:
                response = client.get("/api/v1/gamification/daily-quests")
                assert response.status_code == 200
                data = response.json()
                assert len(data) == 1
                assert data[0]["title"] == "Заверши 3 задачи"
                assert data[0]["is_completed"] == False
            finally:
                app.dependency_overrides = original_overrides

    def test_update_quest_progress_updates_and_awards(self, client_with_auth):
        """Update quest progress should update and award points on completion."""
        with client_with_auth as client:
            from app.modules.gamification.router import get_service
            from app.modules.gamification.service import GamificationService

            mock_quest = MagicMock()
            mock_quest.id = 1
            mock_quest.quest_type = "task_completed"
            mock_quest.title = "Заверши 3 задачи"
            mock_quest.description = "Заверши 3 задачи сегодня"
            mock_quest.target_count = 3
            mock_quest.current_count = 3
            mock_quest.reward_points = 10
            mock_quest.reward_xp = 20
            mock_quest.is_completed = True
            mock_quest.completed_at = datetime(2025, 1, 1)

            mock_service = MagicMock(spec=GamificationService)
            mock_service.quest_repo = MagicMock()
            mock_service.quest_repo.update_quest_progress = AsyncMock(return_value=mock_quest)
            mock_service.award_event = AsyncMock(return_value=None)
            mock_service.combo_repo = MagicMock()
            mock_service.combo_repo.increment_combo = AsyncMock(return_value=None)

            async def override_service():
                return mock_service

            from app.main import app
            original_overrides = dict(app.dependency_overrides)
            app.dependency_overrides[get_service] = override_service

            try:
                response = client.post("/api/v1/gamification/daily-quests/task_completed/progress")
                assert response.status_code == 200
                data = response.json()
                assert data["is_completed"] == True
                assert data["current_count"] == 3
                mock_service.combo_repo.increment_combo.assert_called()
            finally:
                app.dependency_overrides = original_overrides
