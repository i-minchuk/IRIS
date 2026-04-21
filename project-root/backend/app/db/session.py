# backend/app/db/session.py
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True,  # Включить логи SQL (для отладки)
    future=True,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def get_db() -> AsyncSession:
    """Зависимость для получения сессии БД в эндпоинтах."""
    async with AsyncSessionLocal() as session:
        yield session