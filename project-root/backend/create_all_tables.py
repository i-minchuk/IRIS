"""Create all tables from SQLAlchemy models."""
import asyncio
from app.db.base import Base
from app.models import *  # noqa
from app.db.session import engine

async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ All tables created from models")

asyncio.run(create_tables())