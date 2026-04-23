# app/modules/gamification/repository.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from datetime import datetime, timezone, date

from app.modules.gamification.models import (
    EngineerMetric,
    GamificationEvent,
    GamificationBadge,
    DailyQuest,
    ComboAchievement,
    Notification,
)


class EngineerMetricRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_user(self, user_id: int) -> Optional[EngineerMetric]:
        result = await self.db.execute(select(EngineerMetric).where(EngineerMetric.user_id == user_id))
        return result.scalar_one_or_none()

    async def create_or_update(self, user_id: int, **kwargs) -> EngineerMetric:
        metric = await self.get_by_user(user_id)
        if not metric:
            metric = EngineerMetric(user_id=user_id, **kwargs)
            self.db.add(metric)
        else:
            for key, value in kwargs.items():
                setattr(metric, key, value)
            metric.last_updated_at = datetime.now(timezone.utc)
        await self.db.commit()
        await self.db.refresh(metric)
        return metric


class GamificationEventRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_score(self, user_id: int) -> int:
        result = await self.db.execute(
            select(func.coalesce(func.sum(GamificationEvent.points_delta), 0)).where(
                GamificationEvent.user_id == user_id
            )
        )
        return result.scalar_one()

    async def get_user_events(self, user_id: int, limit: int = 100) -> list[GamificationEvent]:
        result = await self.db.execute(
            select(GamificationEvent)
            .where(GamificationEvent.user_id == user_id)
            .order_by(GamificationEvent.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def create(self, event: GamificationEvent) -> GamificationEvent:
        self.db.add(event)
        await self.db.commit()
        await self.db.refresh(event)
        return event


class GamificationBadgeRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_badges(self, user_id: int) -> list[GamificationBadge]:
        result = await self.db.execute(
            select(GamificationBadge)
            .where(GamificationBadge.user_id == user_id)
            .order_by(GamificationBadge.awarded_at.desc())
        )
        return list(result.scalars().all())

    async def award_badge(self, user_id: int, badge_id: str, name: str, description: str) -> GamificationBadge:
        badge = GamificationBadge(
            user_id=user_id,
            badge_id=badge_id,
            name=name,
            description=description,
        )
        self.db.add(badge)
        await self.db.commit()
        await self.db.refresh(badge)
        return badge


class DailyQuestRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_daily_quests(self, user_id: int) -> list[DailyQuest]:
        today = date.today()
        result = await self.db.execute(
            select(DailyQuest)
            .where(DailyQuest.user_id == user_id)
            .where(func.date(DailyQuest.date) == today)
        )
        return list(result.scalars().all())

    async def get_by_type(self, user_id: int, quest_type: str) -> Optional[DailyQuest]:
        today = date.today()
        result = await self.db.execute(
            select(DailyQuest)
            .where(DailyQuest.user_id == user_id)
            .where(DailyQuest.quest_type == quest_type)
            .where(func.date(DailyQuest.date) == today)
        )
        return result.scalar_one_or_none()

    async def update_quest_progress(self, user_id: int, quest_type: str) -> Optional[DailyQuest]:
        quest = await self.get_by_type(user_id, quest_type)
        if not quest:
            return None
        quest.current_count += 1
        if quest.current_count >= quest.target_count:
            quest.is_completed = True
            quest.completed_at = datetime.now(timezone.utc)
        await self.db.commit()
        await self.db.refresh(quest)
        return quest

    async def create_default_quests(self, user_id: int) -> list[DailyQuest]:
        today = datetime.now(timezone.utc)
        quests = [
            DailyQuest(
                user_id=user_id,
                quest_type="task_completed",
                title="Заверши 3 задачи",
                description="Заверши 3 задачи сегодня",
                target_count=3,
                reward_points=10,
                reward_xp=20,
                date=today,
            ),
        ]
        for q in quests:
            self.db.add(q)
        await self.db.commit()
        for q in quests:
            await self.db.refresh(q)
        return quests


class ComboAchievementRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_active_combo(self, user_id: int, combo_type: str) -> Optional[ComboAchievement]:
        result = await self.db.execute(
            select(ComboAchievement)
            .where(ComboAchievement.user_id == user_id)
            .where(ComboAchievement.combo_type == combo_type)
            .where(ComboAchievement.is_active == True)
        )
        return result.scalar_one_or_none()

    async def increment_combo(self, user_id: int, combo_type: str) -> ComboAchievement:
        combo = await self.get_active_combo(user_id, combo_type)
        now = datetime.now(timezone.utc)
        if not combo or combo.expires_at < now:
            combo = ComboAchievement(
                user_id=user_id,
                combo_type=combo_type,
                current_count=1,
                expires_at=now,  # simplify
                is_active=True,
            )
            self.db.add(combo)
        else:
            combo.current_count += 1
            if combo.current_count > combo.max_count:
                combo.current_count = combo.max_count
        await self.db.commit()
        await self.db.refresh(combo)
        return combo


class NotificationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_notifications(self, user_id: int, limit: int = 50) -> list[Notification]:
        result = await self.db.execute(
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def mark_as_read(self, notification_id: int, user_id: int) -> bool:
        result = await self.db.execute(
            select(Notification).where(
                Notification.id == notification_id,
                Notification.user_id == user_id,
            )
        )
        notif = result.scalar_one_or_none()
        if notif:
            notif.is_read = True
            await self.db.commit()
            return True
        return False

    async def get_unread_count(self, user_id: int) -> int:
        result = await self.db.execute(
            select(func.count(Notification.id)).where(
                Notification.user_id == user_id,
                Notification.is_read == False,
            )
        )
        return result.scalar_one()

    async def create(self, user_id: int, type: str, title: str, message: str) -> Notification:
        notif = Notification(user_id=user_id, type=type, title=title, message=message)
        self.db.add(notif)
        await self.db.commit()
        await self.db.refresh(notif)
        return notif
