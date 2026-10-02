# app/modules/gamification/service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from datetime import datetime, timezone

from app.modules.gamification.models import GamificationEvent

from app.modules.gamification.repository import (
    EngineerMetricRepository,
    GamificationEventRepository,
    GamificationBadgeRepository,
    DailyQuestRepository,
    ComboAchievementRepository,
    NotificationRepository,
)
from app.modules.auth.repository import UserRepository


LEVELS = [
    (0, "Новичок", 100),
    (100, "Специалист", 300),
    (300, "Профессионал", 600),
    (600, "Эксперт", 1000),
    (1000, "Мастер", None),
]


def calculate_level(score: int) -> tuple[int, str, Optional[int]]:
    for i, (min_score, title, next_at) in enumerate(LEVELS):
        if score < min_score:
            prev = LEVELS[i - 1]
            return i, prev[1], prev[2]
    return len(LEVELS), LEVELS[-1][1], None


class GamificationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.metric_repo = EngineerMetricRepository(db)
        self.event_repo = GamificationEventRepository(db)
        self.badge_repo = GamificationBadgeRepository(db)
        self.quest_repo = DailyQuestRepository(db)
        self.combo_repo = ComboAchievementRepository(db)
        self.notif_repo = NotificationRepository(db)
        self.user_repo = UserRepository(db)

    async def get_profile(self, user_id: int) -> dict:
        score = await self.event_repo.get_user_score(user_id)
        level, level_title, next_level_at = calculate_level(score)
        badges = await self.badge_repo.get_user_badges(user_id)
        return {
            "score": score,
            "xp": score * 2,  # simplified
            "level": level,
            "level_title": level_title,
            "next_level_at": next_level_at,
            "badges": [b.badge_id for b in badges],
            "workflow_stats": await self.get_workflow_stats(user_id),
        }

    async def get_workflow_stats(self, user_id: int) -> dict:
        """Статистика согласований документооборота: в срок / с просрочкой + серия."""
        on_time_type = "workflow_step_approved_on_time"
        late_type = "workflow_step_approved_late"
        sent_on_time_type = "document_sent_on_time"
        sent_late_type = "document_sent_late"
        result = await self.db.execute(
            select(
                GamificationEvent.event_type,
                GamificationEvent.created_at,
            ).where(
                GamificationEvent.user_id == user_id,
                GamificationEvent.event_type.in_(
                    [on_time_type, late_type, sent_on_time_type, sent_late_type]
                ),
            ).order_by(GamificationEvent.created_at.asc())
        )
        rows = result.all()
        on_time = sum(1 for r in rows if r.event_type == on_time_type)
        late = sum(1 for r in rows if r.event_type == late_type)
        sent_on_time = sum(1 for r in rows if r.event_type == sent_on_time_type)
        sent_late = sum(1 for r in rows if r.event_type == sent_late_type)
        # Текущая серия: сколько согласований в срок подряд без просрочки
        streak = 0
        for r in reversed(rows):
            if r.event_type == on_time_type:
                streak += 1
            elif r.event_type == late_type:
                break
        return {
            "on_time_approvals": on_time,
            "late_approvals": late,
            "current_streak": streak,
            "on_time_badge": any(
                b.badge_id == "on_time_approver"
                for b in await self.badge_repo.get_user_badges(user_id)
            ),
            "sent_on_time": sent_on_time,
            "sent_late": sent_late,
        }

    async def get_leaderboard(self, exclude_roles: list[str] = None) -> list[dict]:
        """Get leaderboard with scores — single JOIN query, no N+1."""
        entries = await self.event_repo.get_all_users_scores(exclude_roles=exclude_roles)
        for i, entry in enumerate(entries, 1):
            entry["rank"] = i
        return entries

    async def award_event(self, user_id: int, event_type: str, points: int = 0, xp: int = 0, **kwargs):
        event = GamificationEvent(
            user_id=user_id,
            event_type=event_type,
            points_delta=points,
            xp_delta=xp,
            **kwargs
        )
        await self.event_repo.create(event)
        metric = await self.metric_repo.get_by_user(user_id)
        if metric:
            await self.metric_repo.create_or_update(
                user_id,
                total_points=metric.total_points + points,
                xp=metric.xp + xp,
            )
        else:
            await self.metric_repo.create_or_update(user_id, total_points=points, xp=xp)
        return event
