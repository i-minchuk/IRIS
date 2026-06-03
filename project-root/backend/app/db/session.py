# backend/app/db/session.py
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool
from app.core.config import settings

# SQLite не поддерживает pool_size и max_overflow — используем NullPool
if "sqlite" in settings.DATABASE_URL:
    primary_engine = create_async_engine(
        settings.DATABASE_URL,
        poolclass=NullPool,
        echo=settings.DEBUG,
        future=True,
        connect_args={"check_same_thread": False},
    )
else:
    primary_engine = create_async_engine(
        settings.DATABASE_URL,
        echo=settings.DB_ECHO,
        future=True,
        pool_size=settings.DB_POOL_SIZE,
        max_overflow=settings.DB_MAX_OVERFLOW,
        pool_timeout=settings.DB_POOL_TIMEOUT,
        pool_recycle=settings.DB_POOL_RECYCLE,
        pool_pre_ping=settings.DB_POOL_PRE_PING,
    )

# Replica (read) — если настроена
replica_engine = None
if getattr(settings, "DATABASE_REPLICA_URL", None):
    if "sqlite" in settings.DATABASE_REPLICA_URL:
        replica_engine = create_async_engine(
            settings.DATABASE_REPLICA_URL,
            poolclass=NullPool,
            echo=settings.DEBUG,
            future=True,
            connect_args={"check_same_thread": False},
        )
    else:
        replica_engine = create_async_engine(
            settings.DATABASE_REPLICA_URL,
            echo=settings.DB_ECHO,
            future=True,
            pool_size=settings.DB_POOL_SIZE,
            max_overflow=settings.DB_MAX_OVERFLOW,
            pool_timeout=settings.DB_POOL_TIMEOUT,
            pool_recycle=settings.DB_POOL_RECYCLE,
            pool_pre_ping=settings.DB_POOL_PRE_PING,
        )

AsyncSessionLocal = async_sessionmaker(
    primary_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

if replica_engine:
    AsyncSessionReplica = async_sessionmaker(
        replica_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
else:
    AsyncSessionReplica = None


async def get_db(read_only: bool = False) -> AsyncSession:
    """Зависимость для получения сессии БД в эндпоинтах.

    При read_only=True и наличии реплики — используется replica_engine.
    """
    if read_only and AsyncSessionReplica is not None:
        async with AsyncSessionReplica() as session:
            yield session
    else:
        async with AsyncSessionLocal() as session:
            yield session


async def get_db_read_only() -> AsyncSession:
    """Зависимость для получения read-only сессии БД."""
    if AsyncSessionReplica is not None:
        async with AsyncSessionReplica() as session:
            yield session
    else:
        async with AsyncSessionLocal() as session:
            yield session
