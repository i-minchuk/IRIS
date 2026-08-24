# backend/app/db/session.py
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from app.core.config import settings

def _engine_kwargs(url: str) -> dict:
    """Пул-параметры только для PostgreSQL; SQLite их не поддерживает."""
    kwargs = {"echo": settings.DB_ECHO, "future": True}
    if not url.startswith("sqlite"):
        kwargs.update(
            pool_size=settings.DB_POOL_SIZE,
            max_overflow=settings.DB_MAX_OVERFLOW,
            pool_timeout=settings.DB_POOL_TIMEOUT,
            pool_recycle=settings.DB_POOL_RECYCLE,
            pool_pre_ping=settings.DB_POOL_PRE_PING,
        )
    return kwargs


primary_engine = create_async_engine(
    settings.DATABASE_URL,
    **_engine_kwargs(settings.DATABASE_URL),
)

# Replica (read) — если настроена
replica_engine = None
if getattr(settings, "DATABASE_REPLICA_URL", None):
    replica_engine = create_async_engine(
        settings.DATABASE_REPLICA_URL,
        **_engine_kwargs(settings.DATABASE_REPLICA_URL),
    )

AsyncSessionLocal = async_sessionmaker(
    primary_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

if replica_engine:
    AsyncSessionLocalReadOnly = async_sessionmaker(
        replica_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
else:
    AsyncSessionLocalReadOnly = AsyncSessionLocal


async def get_db():
    """Primary read-write session."""
    async with AsyncSessionLocal() as session:
        yield session


async def get_db_read_only():
    """Read-only session (uses replica if configured)."""
    async with AsyncSessionLocalReadOnly() as session:
        yield session
