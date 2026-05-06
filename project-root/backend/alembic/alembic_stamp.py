"""Stamp Alembic head for PostgreSQL"""
import asyncio
from alembic.config import Config
from alembic import command

alembic_cfg = Config("alembic.ini")
alembic_cfg.set_main_option("sqlalchemy.url", "postgresql+asyncpg://iris:iris_dev_password@localhost:5432/iris_dev")

try:
    command.stamp(alembic_cfg, "head")
    print("[OK] Alembic stamped to head")
except Exception as e:
    print(f"[ERROR] {e}")
