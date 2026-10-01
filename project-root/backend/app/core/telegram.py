"""Отправка уведомлений через Telegram Bot API.

Реализация на httpx — без внешней зависимости python-telegram-bot
(в проекте её нет, а модуль `telegram` не установлен).
Пока TELEGRAM_BOT_TOKEN не задан, сообщения пишутся в лог.
"""
import logging

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.modules.auth.repository import UserRepository

logger = logging.getLogger(__name__)

_BOT_API_URL = "https://api.telegram.org/bot{token}/sendMessage"


def telegram_configured() -> bool:
    """True, если задан токен бота."""
    return bool(settings.TELEGRAM_BOT_TOKEN)


async def send_telegram_message(chat_id: str, text: str) -> dict | None:
    """Отправить сообщение в Telegram. Возвращает ответ API или None, если бот не настроен."""
    if not telegram_configured():
        logger.warning("[TELEGRAM MOCK] Chat: %s, Text: %s", chat_id, text)
        return None

    url = _BOT_API_URL.format(token=settings.TELEGRAM_BOT_TOKEN)
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.post(
            url,
            json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"},
        )
        response.raise_for_status()
        return response.json()


async def notify_user_telegram(
    user_id: int, notification_type: str, data: dict, db: AsyncSession
) -> None:
    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if not user or not user.telegram_chat_id:
        return

    messages = {
        "task_assigned": f"📝 <b>Новая задача</b>\n{data.get('task_title')}",
        "deadline_approaching": f"⏰ <b>Дедлайн через {data.get('days')} дней</b>\n{data.get('task_title')}",
        "document_approved": f"✅ <b>Документ утверждён</b>\n{data.get('document_name')}",
    }
    text = messages.get(notification_type, "🔔 Новое уведомление")
    await send_telegram_message(user.telegram_chat_id, text)
