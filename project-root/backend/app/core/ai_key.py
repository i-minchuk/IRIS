from __future__ import annotations

import logging
from typing import Optional

from openai import AsyncOpenAI
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.gigachat import create_ai_client, is_gigachat_credentials
from app.core.config import settings

logger = logging.getLogger(__name__)

DEFAULT_SETTINGS_KEY = "default"


def mask_openai_api_key(key: Optional[str]) -> str:
    """Маскирует API-ключ: первые 3 и последние 4 символа, остальное — *."""
    if not key:
        return ""
    if len(key) <= 8:
        return "*" * len(key)
    return f"{key[:3]}{'*' * (len(key) - 7)}{key[-4:]}"


async def _get_or_create_settings_row(db: AsyncSession) -> "AISetting":
    """Возвращает единственную строку настроек, создавая при необходимости."""
    from app.modules.ai.models import AISetting

    result = await db.execute(select(AISetting).where(AISetting.key == DEFAULT_SETTINGS_KEY))
    row = result.scalar_one_or_none()
    if row is None:
        row = AISetting(key=DEFAULT_SETTINGS_KEY)
        db.add(row)
        await db.commit()
        await db.refresh(row)
    return row


async def get_openai_api_key(db: AsyncSession) -> Optional[str]:
    """Возвращает активный OpenAI API ключ.

    Приоритет:
    1. Переменная окружения / .env (settings.OPENAI_API_KEY)
    2. Значение из БД (ai_settings.openai_api_key)
    """
    env_key = settings.OPENAI_API_KEY
    if env_key:
        return env_key

    from app.modules.ai.models import AISetting

    result = await db.execute(select(AISetting).where(AISetting.key == DEFAULT_SETTINGS_KEY))
    row = result.scalar_one_or_none()
    return row.openai_api_key if row else None


async def is_openai_configured(db: AsyncSession) -> bool:
    """True, если ключ доступен (env или БД)."""
    return bool(await get_openai_api_key(db))


async def set_openai_api_key(db: AsyncSession, key: str) -> str:
    """Сохраняет ключ в БД и обновляет runtime-настройки.

    Возвращает маскированный ключ.
    """
    from app.modules.ai.models import AISetting

    key = key.strip()
    if not key:
        raise ValueError("API ключ не может быть пустым")

    row = await _get_or_create_settings_row(db)
    row.openai_api_key = key
    await db.commit()
    await db.refresh(row)

    # Обновляем runtime-значение, чтобы уже созданные экземпляры AIService
    # и прямые проверки settings.OPENAI_API_KEY работали без перезапуска.
    try:
        settings.OPENAI_API_KEY = key
    except Exception:
        object.__setattr__(settings, "OPENAI_API_KEY", key)

    # Для GigaChat подменяем модель по умолчанию, если не задана явно через env.
    if is_gigachat_credentials(key):
        try:
            settings.LLM_MODEL = settings.GIGACHAT_DEFAULT_MODEL
        except Exception:
            object.__setattr__(settings, "LLM_MODEL", settings.GIGACHAT_DEFAULT_MODEL)
        try:
            settings.EMBEDDING_MODEL = settings.GIGACHAT_DEFAULT_EMBEDDING_MODEL
        except Exception:
            object.__setattr__(settings, "EMBEDDING_MODEL", settings.GIGACHAT_DEFAULT_MODEL)

    logger.info("OpenAI API key updated in DB and runtime settings")
    return mask_openai_api_key(key)


def _configure_model_for_key(key: str) -> None:
    """Подменяет LLM/embedding модель под выбранного провайдера."""
    if is_gigachat_credentials(key):
        try:
            settings.LLM_MODEL = settings.GIGACHAT_DEFAULT_MODEL
        except Exception:
            object.__setattr__(settings, "LLM_MODEL", settings.GIGACHAT_DEFAULT_MODEL)
        try:
            settings.EMBEDDING_MODEL = settings.GIGACHAT_DEFAULT_EMBEDDING_MODEL
        except Exception:
            object.__setattr__(settings, "EMBEDDING_MODEL", settings.GIGACHAT_DEFAULT_MODEL)


async def get_ai_client(db: AsyncSession) -> AsyncOpenAI:
    """Возвращает настроенного OpenAI-совместимого клиента.

    Автоматически выбирает провайдера (OpenAI / GigaChat) по формату ключа.
    """
    key = await get_openai_api_key(db)
    if not key:
        raise ValueError("AI API ключ не настроен")
    # Синхронизируем runtime-настройки, чтобы sync-проверки (например,
    # supports_json_response_format) видели актуального провайдера.
    try:
        settings.OPENAI_API_KEY = key
    except Exception:
        object.__setattr__(settings, "OPENAI_API_KEY", key)
    _configure_model_for_key(key)
    return await create_ai_client(key)


async def get_ai_client_from_settings() -> AsyncOpenAI:
    """Возвращает клиента на основе runtime-настройки settings.OPENAI_API_KEY.

    Используется в модулях, где нет доступа к БД.
    """
    key = settings.OPENAI_API_KEY
    if not key:
        raise ValueError("AI API ключ не настроен")
    _configure_model_for_key(key)
    return await create_ai_client(key)


def supports_json_response_format() -> bool:
    """True, если текущий провайдер поддерживает response_format={'type': 'json_object'}."""
    return not is_gigachat_credentials(settings.OPENAI_API_KEY)


async def load_openai_api_key_into_settings(db: AsyncSession) -> None:
    """При старте приложения подгружает ключ из БД в settings, если env пуст."""
    if settings.OPENAI_API_KEY:
        return

    from app.modules.ai.models import AISetting

    result = await db.execute(select(AISetting).where(AISetting.key == DEFAULT_SETTINGS_KEY))
    row = result.scalar_one_or_none()
    if row and row.openai_api_key:
        try:
            settings.OPENAI_API_KEY = row.openai_api_key
        except Exception:
            object.__setattr__(settings, "OPENAI_API_KEY", row.openai_api_key)
        if is_gigachat_credentials(row.openai_api_key):
            try:
                settings.LLM_MODEL = settings.GIGACHAT_DEFAULT_MODEL
            except Exception:
                object.__setattr__(settings, "LLM_MODEL", settings.GIGACHAT_DEFAULT_MODEL)
            try:
                settings.EMBEDDING_MODEL = settings.GIGACHAT_DEFAULT_EMBEDDING_MODEL
            except Exception:
                object.__setattr__(settings, "EMBEDDING_MODEL", settings.GIGACHAT_DEFAULT_MODEL)
        logger.info("OpenAI API key loaded from DB into runtime settings")
