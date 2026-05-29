# app/modules/notifications/router.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.auth.deps import get_current_active_user
from app.modules.auth.models import User
from app.core.email import send_email
from app.modules.gamification.repository import NotificationRepository
from app.modules.notifications.schemas import (
    NotificationResponse,
    NotificationListResponse,
    NotificationReadResponse,
    NotificationDeleteResponse,
)

router = APIRouter()


def get_notif_repo(db: AsyncSession = Depends(get_db)) -> NotificationRepository:
    return NotificationRepository(db)


@router.get("", response_model=NotificationListResponse)
async def list_notifications(
    *,
    current_user: User = Depends(get_current_active_user),
    repo: NotificationRepository = Depends(get_notif_repo),
):
    """Список уведомлений текущего пользователя."""
    notifs = await repo.get_user_notifications(current_user.id, limit=100)
    unread_count = await repo.get_unread_count(current_user.id)
    items = [
        NotificationResponse(
            id=n.id,
            type=n.type,
            title=n.title,
            message=n.message,
            is_read=n.is_read,
            created_at=n.created_at,
            meta=n.meta,
        )
        for n in notifs
    ]
    return NotificationListResponse(items=items, unread_count=unread_count)


@router.patch("/{notification_id}/read", response_model=NotificationReadResponse)
async def mark_notification_read(
    *,
    notification_id: int,
    current_user: User = Depends(get_current_active_user),
    repo: NotificationRepository = Depends(get_notif_repo),
):
    """Отметить уведомление как прочитанное."""
    ok = await repo.mark_as_read(notification_id, current_user.id)
    if not ok:
        raise HTTPException(status_code=404, detail="Notification not found")
    return NotificationReadResponse(ok=True)


@router.patch("/read-all", response_model=NotificationReadResponse)
async def mark_all_notifications_read(
    *,
    current_user: User = Depends(get_current_active_user),
    repo: NotificationRepository = Depends(get_notif_repo),
):
    """Отметить все уведомления пользователя как прочитанные."""
    notifs = await repo.get_user_notifications(current_user.id, limit=1000)
    for n in notifs:
        if not n.is_read:
            n.is_read = True
    await repo.db.commit()
    return NotificationReadResponse(ok=True)


@router.delete("/{notification_id}", response_model=NotificationDeleteResponse)
async def delete_notification(
    *,
    notification_id: int,
    current_user: User = Depends(get_current_active_user),
    repo: NotificationRepository = Depends(get_notif_repo),
):
    """Удалить уведомление."""
    from sqlalchemy import select
    from app.modules.gamification.models import Notification

    result = await repo.db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
    )
    notif = result.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    await repo.db.delete(notif)
    await repo.db.commit()
    return NotificationDeleteResponse(ok=True)


@router.post("/test-email")
async def test_email(
    to: str,
    current_user: User = Depends(get_current_active_user),
):
    await send_email(to, "Тест", "<h1>Тестовое письмо</h1>")
    return {"status": "sent"}
