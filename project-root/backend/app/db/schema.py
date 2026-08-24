"""Автосоздание схемы БД при старте, если база пустая.

Alembic-миграции остаются основным механизмом для PostgreSQL
(`alembic upgrade head` запускается при старте контейнера), но для
локального запуска на свежем SQLite-файле схема создаётся напрямую
через metadata.create_all.

Используется одноразовый движок с NullPool: соединение не попадает в
основной пул приложения и не переживает текущий event loop (иначе
TestClient в pytest ловит «Event loop is closed» на asyncpg).
"""
import logging

from sqlalchemy import inspect
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.pool import NullPool

logger = logging.getLogger("dokpotok")


async def ensure_schema() -> None:
    """Создать таблицы, если в БД нет даже users (пустая база)."""
    import app.models  # noqa: F401 — регистрация всех моделей

    from app.core.config import settings
    from app.db.base import Base

    engine = create_async_engine(settings.DATABASE_URL, poolclass=NullPool)
    try:
        async with engine.begin() as conn:
            has_users = await conn.run_sync(
                lambda sync_conn: inspect(sync_conn).has_table("users")
            )
            if has_users:
                return
            logger.warning(
                "База данных пустая — создаю схему через metadata.create_all. "
                "Для PostgreSQL предпочтительно: alembic upgrade head"
            )
            await conn.run_sync(Base.metadata.create_all)
    finally:
        await engine.dispose()
