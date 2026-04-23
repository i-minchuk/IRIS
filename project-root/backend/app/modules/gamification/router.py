# app/modules/gamification/router.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.db.session import get_db
from app.modules.auth.deps import get_current_active_user
from app.modules.auth.models import User
from app.modules.gamification.service import GamificationService
from app.modules.gamification.schemas import (
    GamificationProfile,
    LeaderboardEntry,
    QuestResponse,
    NotificationResponse,
)

router = APIRouter()

BADGE_DEFINITIONS = [
    {"id": "first_project", "name": "Первый проект", "description": "Создание первого проекта"},
    {"id": "reliable", "name": "Надёжный", "description": "5 задач подряд без просрочки"},
    {"id": "speedster", "name": "Скоростной", "description": "3 документа за день"},
    {"id": "quality", "name": "Качество", "description": "10 документов без замечаний"},
    {"id": "marathon", "name": "Марафонец", "description": "50 дней активной работы"},
]


def get_service(db: AsyncSession = Depends(get_db)) -> GamificationService:
    return GamificationService(db)


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
async def leaderboard(
    *,
    current_user: User = Depends(get_current_active_user),
    service: GamificationService = Depends(get_service),
):
    """Таблица лидеров (исключая админов)."""
    return await service.get_leaderboard()


@router.get("/me")
async def my_profile(
    *,
    current_user: User = Depends(get_current_active_user),
    service: GamificationService = Depends(get_service),
):
    """Профиль геймификации текущего пользователя."""
    return await service.get_profile(current_user.id)


@router.get("/badges")
async def available_badges(
    *,
    current_user: User = Depends(get_current_active_user),
):
    """Список всех доступных бейджей."""
    return BADGE_DEFINITIONS


@router.get("/notifications", response_model=list[NotificationResponse])
async def get_notifications(
    *,
    current_user: User = Depends(get_current_active_user),
    service: GamificationService = Depends(get_service),
):
    """Уведомления текущего пользователя."""
    notifs = await service.notif_repo.get_user_notifications(current_user.id)
    return [
        {
            "id": n.id,
            "type": n.type,
            "title": n.title,
            "message": n.message,
            "is_read": n.is_read,
            "created_at": n.created_at,
        }
        for n in notifs
    ]


@router.post("/notifications/{notification_id}/read")
async def mark_notification_read(
    *,
    notification_id: int,
    current_user: User = Depends(get_current_active_user),
    service: GamificationService = Depends(get_service),
):
    """Отметить уведомление как прочитанное."""
    ok = await service.notif_repo.mark_as_read(notification_id, current_user.id)
    return {"ok": ok}


@router.get("/notifications/unread-count")
async def get_unread_count(
    *,
    current_user: User = Depends(get_current_active_user),
    service: GamificationService = Depends(get_service),
):
    """Количество непрочитанных уведомлений."""
    count = await service.notif_repo.get_unread_count(current_user.id)
    return {"count": count}


@router.get("/daily-quests", response_model=list[QuestResponse])
async def get_daily_quests(
    *,
    current_user: User = Depends(get_current_active_user),
    service: GamificationService = Depends(get_service),
):
    """Ежедневные задания пользователя."""
    quests = await service.quest_repo.get_user_daily_quests(current_user.id)
    if not quests:
        quests = await service.quest_repo.create_default_quests(current_user.id)
    return [
        {
            "id": q.id,
            "quest_type": q.quest_type,
            "title": q.title,
            "description": q.description,
            "target_count": q.target_count,
            "current_count": q.current_count,
            "reward_points": q.reward_points,
            "reward_xp": q.reward_xp,
            "is_completed": q.is_completed,
            "completed_at": q.completed_at,
        }
        for q in quests
    ]


@router.post("/daily-quests/{quest_type}/progress")
async def update_quest_progress(
    *,
    quest_type: str,
    current_user: User = Depends(get_current_active_user),
    service: GamificationService = Depends(get_service),
):
    """Обновить прогресс ежедневного задания."""
    quest = await service.quest_repo.update_quest_progress(current_user.id, quest_type)
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    if quest.is_completed:
        await service.award_event(
            current_user.id,
            "quest_completed",
            points=quest.reward_points,
            xp=quest.reward_xp,
        )
        await service.combo_repo.increment_combo(current_user.id, "daily_quests")
    return {
        "id": quest.id,
        "quest_type": quest.quest_type,
        "title": quest.title,
        "description": quest.description,
        "target_count": quest.target_count,
        "current_count": quest.current_count,
        "reward_points": quest.reward_points,
        "reward_xp": quest.reward_xp,
        "is_completed": quest.is_completed,
        "completed_at": quest.completed_at,
    }
