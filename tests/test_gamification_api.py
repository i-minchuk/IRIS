"""Unit tests for gamification API endpoints."""
import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime


class TestGamificationLeaderboard:
    """Tests for /api/gamification/leaderboard endpoint."""

    @patch('api.gamification_api.get_locator')
    def test_leaderboard_excludes_admins(self, mock_get_locator):
        """Leaderboard should exclude admin users."""
        # Setup mocks
        mock_locator = MagicMock()
        mock_get_locator.return_value = mock_locator
        
        # Mock users - one admin, one regular user
        mock_admin = MagicMock()
        mock_admin.id = 1
        mock_admin.username = "admin_user"
        mock_admin.full_name = "Admin User"
        mock_admin.role = "admin"
        
        mock_regular = MagicMock()
        mock_regular.id = 2
        mock_regular.username = "engineer1"
        mock_regular.full_name = "Engineer One"
        mock_regular.role = "engineer"
        
        mock_locator.user_repo.get_all.return_value = [mock_admin, mock_regular]
        mock_locator.gamification_event_repo.get_user_score.return_value = 150
        mock_locator.gamification_badge_repo.get_user_badges.return_value = []
        
        # Import and call
        from api.gamification_api import leaderboard
        from models.user import User
        
        mock_user = MagicMock(spec=User)
        mock_user.id = 1
        mock_user.role = "admin"
        
        result = leaderboard(current_user=mock_user)
        
        # Assert admin is excluded
        assert len(result) == 1
        assert result[0]["username"] == "engineer1"

    @patch('api.gamification_api.get_locator')
    def test_leaderboard_sorted_by_score(self, mock_get_locator):
        """Leaderboard should be sorted by score descending."""
        # Setup mocks
        mock_locator = MagicMock()
        mock_get_locator.return_value = mock_locator
        
        # Mock users with different scores
        users = []
        for i, score in enumerate([50, 200, 100]):
            mock_user = MagicMock()
            mock_user.id = i + 1
            mock_user.username = f"user{i+1}"
            mock_user.full_name = f"User {i+1}"
            mock_user.role = "engineer"
            users.append(mock_user)
        
        mock_locator.user_repo.get_all.return_value = users
        mock_locator.gamification_event_repo.get_user_score.side_effect = [50, 200, 100]
        mock_locator.gamification_badge_repo.get_user_badges.return_value = []
        
        # Import and call
        from api.gamification_api import leaderboard
        from models.user import User
        
        mock_user = MagicMock(spec=User)
        mock_user.id = 1
        mock_user.role = "admin"
        
        result = leaderboard(current_user=mock_user)
        
        # Assert sorted by score descending
        assert result[0]["score"] == 200
        assert result[1]["score"] == 100
        assert result[2]["score"] == 50
        
        # Assert ranks assigned correctly
        assert result[0]["rank"] == 1
        assert result[1]["rank"] == 2
        assert result[2]["rank"] == 3


class TestGamificationProfile:
    """Tests for /api/gamification/me endpoint."""

    @patch('api.gamification_api.get_locator')
    def test_profile_includes_score_and_level(self, mock_get_locator):
        """Profile should include user score and level."""
        # Setup mocks
        mock_locator = MagicMock()
        mock_get_locator.return_value = mock_locator
        
        mock_locator.gamification_event_repo.get_user_score.return_value = 250
        mock_locator.gamification_event_repo.get_user_events.return_value = []
        mock_locator.gamification_badge_repo.get_user_badges.return_value = []
        
        # Import and call
        from api.gamification_api import my_profile
        from models.user import User
        
        mock_user = MagicMock(spec=User)
        mock_user.id = 1
        mock_user.username = "testuser"
        mock_user.full_name = "Test User"
        
        result = my_profile(current_user=mock_user)
        
        # Assert score and level
        assert result["score"] == 250
        assert result["level"] == 3  # 250 points = level 3 (Professional)
        assert result["level_title"] == "Профессионал"

    @patch('api.gamification_api.get_locator')
    def test_profile_includes_badges(self, mock_get_locator):
        """Profile should include user badges."""
        # Setup mocks
        mock_locator = MagicMock()
        mock_get_locator.return_value = mock_locator
        
        mock_locator.gamification_event_repo.get_user_score.return_value = 100
        mock_locator.gamification_event_repo.get_user_events.return_value = []
        
        # Mock badges
        mock_badge = MagicMock()
        mock_badge.badge_id = "first_project"
        mock_badge.name = "Первый проект"
        mock_badge.description = "Создание первого проекта"
        mock_badge.awarded_at = datetime(2025, 1, 1)
        
        mock_locator.gamification_badge_repo.get_user_badges.return_value = [mock_badge]
        
        # Import and call
        from api.gamification_api import my_profile
        from models.user import User
        
        mock_user = MagicMock(spec=User)
        mock_user.id = 1
        mock_user.username = "testuser"
        mock_user.full_name = "Test User"
        
        result = my_profile(current_user=mock_user)
        
        # Assert badges included
        assert len(result["badges"]) == 1
        assert result["badges"][0]["name"] == "Первый проект"


class TestGamificationBadges:
    """Tests for /api/gamification/badges endpoint."""

    def test_available_badges_returns_definitions(self):
        """Available badges endpoint should return badge definitions."""
        from api.gamification_api import available_badges, BADGE_DEFINITIONS
        from models.user import User
        
        mock_user = MagicMock(spec=User)
        mock_user.id = 1
        
        result = available_badges(current_user=mock_user)
        
        # Assert all badge definitions returned
        assert len(result) == len(BADGE_DEFINITIONS)
        assert result[0]["id"] == "first_project"
        assert result[0]["name"] == "Первый проект"


class TestGamificationNotifications:
    """Tests for gamification notification endpoints."""

    @patch('api.gamification_api.get_locator')
    def test_get_notifications_returns_list(self, mock_get_locator):
        """Get notifications should return list of notifications."""
        # Setup mocks
        mock_locator = MagicMock()
        mock_get_locator.return_value = mock_locator
        
        # Mock notification
        mock_notification = MagicMock()
        mock_notification.id = 1
        mock_notification.type = "badge_awarded"
        mock_notification.title = "🏆 Получен бейдж"
        mock_notification.message = "Поздравляем!"
        mock_notification.is_read = False
        mock_notification.created_at = datetime(2025, 1, 1)
        
        mock_locator.notification_repo.get_user_notifications.return_value = [mock_notification]
        
        # Import and call
        from api.gamification_api import get_notifications
        from models.user import User
        
        mock_user = MagicMock(spec=User)
        mock_user.id = 1
        
        result = get_notifications(current_user=mock_user)
        
        # Assert notification returned
        assert len(result) == 1
        assert result[0]["type"] == "badge_awarded"
        assert result[0]["is_read"] == False

    @patch('api.gamification_api.get_locator')
    def test_mark_notification_read_returns_success(self, mock_get_locator):
        """Mark notification as read should return success."""
        # Setup mocks
        mock_locator = MagicMock()
        mock_get_locator.return_value = mock_locator
        mock_locator.notification_repo.mark_as_read.return_value = True
        
        # Import and call
        from api.gamification_api import mark_notification_read
        from models.user import User
        
        mock_user = MagicMock(spec=User)
        mock_user.id = 1
        
        result = mark_notification_read(notification_id=1, current_user=mock_user)
        
        # Assert success
        assert result["ok"] == True
        mock_locator.notification_repo.mark_as_read.assert_called_once_with(1, 1)

    @patch('api.gamification_api.get_locator')
    def test_get_unread_count_returns_count(self, mock_get_locator):
        """Get unread count should return count."""
        # Setup mocks
        mock_locator = MagicMock()
        mock_get_locator.return_value = mock_locator
        mock_locator.notification_repo.get_unread_count.return_value = 5
        
        # Import and call
        from api.gamification_api import get_unread_count
        from models.user import User
        
        mock_user = MagicMock(spec=User)
        mock_user.id = 1
        
        result = get_unread_count(current_user=mock_user)
        
        # Assert count returned
        assert result["count"] == 5


class TestDailyQuests:
    """Tests for daily quests endpoints."""

    @patch('api.gamification_api.get_locator')
    def test_get_daily_quests_returns_quests(self, mock_get_locator):
        """Get daily quests should return list of quests."""
        # Setup mocks
        mock_locator = MagicMock()
        mock_get_locator.return_value = mock_locator
        
        # Mock quest
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
        
        mock_locator.daily_quest_repo.get_user_daily_quests.return_value = [mock_quest]
        
        # Import and call
        from api.gamification_api import get_daily_quests
        from models.user import User
        
        mock_user = MagicMock(spec=User)
        mock_user.id = 1
        
        result = get_daily_quests(current_user=mock_user)
        
        # Assert quest returned
        assert len(result) == 1
        assert result[0]["title"] == "Заверши 3 задачи"
        assert result[0]["is_completed"] == False

    @patch('api.gamification_api.get_locator')
    def test_update_quest_progress_updates_and_awards(self, mock_get_locator):
        """Update quest progress should update and award points on completion."""
        # Setup mocks
        mock_locator = MagicMock()
        mock_get_locator.return_value = mock_locator
        
        # Mock completed quest
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
        
        mock_locator.daily_quest_repo.update_quest_progress.return_value = mock_quest
        
        # Import and call
        from api.gamification_api import update_quest_progress
        from models.user import User
        
        mock_user = MagicMock(spec=User)
        mock_user.id = 1
        
        result = update_quest_progress(quest_type="task_completed", current_user=mock_user)
        
        # Assert quest updated
        assert result["is_completed"] == True
        assert result["current_count"] == 3
        # Verify gamification awarded
        mock_locator.combo_achievement_repo.increment_combo.assert_called()
