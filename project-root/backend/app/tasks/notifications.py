"""Celery-задачи уведомлений.

Отправка идёт через общие транспорты app.core.email / app.core.telegram:
как только заданы SMTP/SendGrid (письма) или TELEGRAM_BOT_TOKEN (Telegram),
уведомления уходят по-настоящему. Если транспорт не настроен, задача
возвращает status="skipped" с причиной — вместо фиктивного "completed".
"""
import asyncio

from sqlalchemy import select

from app.core.email import email_configured, send_email as core_send_email
from app.db.session import AsyncSessionLocal
from app.modules.auth.models import User
from app.modules.projects.models import Project
from app.tasks.celery_app import celery_app


@celery_app.task(bind=True, max_retries=3)
def send_email(self, to: str, subject: str, body: str, html: str | None = None):
    """Отправка email-уведомления через настроенный SMTP/SendGrid."""
    try:
        status = asyncio.run(core_send_email(to, subject, html or body, body))
        if status is None:
            return {
                "status": "skipped",
                "reason": "email_not_configured",
                "recipient": to,
                "subject": subject,
            }
        return {
            "status": "completed",
            "recipient": to,
            "subject": subject,
            "http_status": status,
        }
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(bind=True, max_retries=3)
def send_push(self, user_id: int, title: str, message: str, data: dict | None = None):
    """Отправка push-уведомления пользователю.

    Push-транспорт (FCM/WebPush) в системе пока не настроен — задача
    честно сообщает об этом, а не имитирует отправку.
    """
    return {
        "status": "skipped",
        "reason": "no_push_service_configured",
        "user_id": user_id,
        "title": title,
    }


@celery_app.task(bind=True, max_retries=3)
def notify_project_members(self, project_id: int, event: str, payload: dict):
    """Уведомление руководителя и создателя проекта о событии по email."""

    async def _notify() -> dict:
        async with AsyncSessionLocal() as db:
            project = await db.get(Project, project_id)
            if project is None:
                return {"status": "failed", "reason": "project_not_found",
                        "project_id": project_id}

            member_ids = {uid for uid in (project.manager_id, project.created_by_id) if uid}
            if not member_ids:
                return {"status": "skipped", "reason": "no_members",
                        "project_id": project_id}

            users = list(
                (
                    await db.execute(
                        select(User).where(
                            User.id.in_(member_ids),
                            User.is_active == True,  # noqa: E712
                            User.email_notifications_enabled == True,  # noqa: E712
                        )
                    )
                ).scalars().all()
            )

            if not email_configured():
                return {
                    "status": "skipped",
                    "reason": "email_not_configured",
                    "project_id": project_id,
                    "recipients": [u.email for u in users],
                }

            project_name = payload.get("project_name") or project.name
            subject = f"ДокПоток IRIS — проект «{project_name}»: {event}"
            body = f"Событие: {event}\nПроект: {project_name}\n\n{payload}"
            sent = 0
            for user in users:
                status = await core_send_email(user.email, subject, body)
                if status is not None:
                    sent += 1
            return {
                "status": "completed",
                "project_id": project_id,
                "event": event,
                "sent": sent,
                "recipients": len(users),
            }

    try:
        return asyncio.run(_notify())
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)
