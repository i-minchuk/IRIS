"""Stamp Alembic head for PostgreSQL - sync version"""
from alembic.config import Config
from alembic import command

alembic_cfg = Config("alembic.ini")
alembic_cfg.set_main_option("sqlalchemy.url", "postgresql://iris:iris_dev_password@localhost:5432/iris_dev")

try:
    command.stamp(alembic_cfg, "head")
    print("[OK] Alembic stamped to head")
except Exception as e:
    print(f"[ERROR] {e}")
