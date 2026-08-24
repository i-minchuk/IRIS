"""Bootstrap-скрипт: создаёт администратора, если его ещё нет.

Демо-данные (проекты, документы, тендеры, тестовые пользователи) удалены —
наполнение БД выполняется только через рабочий интерфейс.
"""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

from app.core.config import settings
from app.modules.auth.models import User

ADMIN = {
    "email": "admin@iris.local",
    "username": "admin",
    "hashed_password": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILp92S.0i",  # "admin123"
    "full_name": "Администратор",
    "role": "admin",
    "is_superuser": True,
    "is_active": True,
    "email_verified": True,
}


async def seed_db():
    """Создать администратора, если пользователей с таким email нет."""
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with AsyncSessionLocal() as session:
        existing = await session.execute(select(User).where(User.email == ADMIN["email"]))
        if existing.scalar():
            print(f"User exists: {ADMIN['email']}")
        else:
            session.add(User(**ADMIN))
            await session.commit()
            print(f"Created user: {ADMIN['email']}")

    print("\n✅ Bootstrap completed successfully!")


if __name__ == "__main__":
    asyncio.run(seed_db())
