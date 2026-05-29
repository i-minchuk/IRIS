from telegram import Bot
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.modules.auth.repository import UserRepository

bot = Bot(token=settings.TELEGRAM_BOT_TOKEN) if settings.TELEGRAM_BOT_TOKEN else None


async def send_telegram_message(chat_id: str, text: str) -> None:
    if not bot:
        print(f"[TELEGRAM MOCK] Chat: {chat_id}, Text: {text}")
        return
    await bot.send_message(chat_id=chat_id, text=text, parse_mode="HTML")


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
