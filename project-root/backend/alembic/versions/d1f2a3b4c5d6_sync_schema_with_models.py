"""sync schema with models (guarded)

Revision ID: d1f2a3b4c5d6
Revises: b1c2d3e4f5g6
Create Date: 2026-09-28 16:30:00.000000

Корректирующая миграция: сводит схему БД с текущими моделями.
Все операции защищены проверками существования — на свежей БД
добавляет недостающее, на существующих БД (где схема уже приведена
вручную) является безопасным no-op.

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = 'd1f2a3b4c5d6'
down_revision: Union[str, None] = 'b1c2d3e4f5g6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    from app.db.base import Base

    bind = op.get_bind()
    insp = inspect(bind)

    # 1. Таблицы: создать недостающие прямо из метаданных моделей
    # (включает колонки, PK, FK, индексы и constraints таблицы).
    for table in Base.metadata.sorted_tables:
        if not insp.has_table(table.name):
            table.create(bind=bind, checkfirst=True)

    # 2. Колонки: добавить недостающие (с FK, где они объявлены в модели).
    for table in Base.metadata.tables.values():
        if not insp.has_table(table.name):
            continue
        db_cols = {c["name"] for c in insp.get_columns(table.name)}
        for col in table.columns:
            if col.name in db_cols:
                continue
            fk_refs = [
                f"{fk.column.table.fullname}.{fk.column.name}"
                for fk in col.foreign_keys
            ]
            new_col = sa.Column(
                col.name,
                col.type,
                *[sa.ForeignKey(ref) for ref in fk_refs],
                nullable=col.nullable,
                server_default=(
                    col.server_default.arg
                    if col.server_default is not None
                    else None
                ),
            )
            op.add_column(table.name, new_col)

    # 3. FK на существующих колонках (если колонка была, а FK — нет).
    for table in Base.metadata.tables.values():
        if not insp.has_table(table.name):
            continue
        db_fks = {
            tuple(fk["constrained_columns"])
            for fk in insp.get_foreign_keys(table.name)
        }
        for fk in table.foreign_keys:
            key = (fk.parent.name,)
            if key in db_fks:
                continue
            op.create_foreign_key(
                None,
                table.name,
                fk.column.table.name,
                [fk.parent.name],
                [fk.column.name],
            )

    # 4. Индексы, объявленные в моделях.
    insp = inspect(bind)
    for table in Base.metadata.tables.values():
        if not insp.has_table(table.name):
            continue
        db_indexes = {ix["name"] for ix in insp.get_indexes(table.name)}
        for ix in table.indexes:
            if ix.name and ix.name not in db_indexes:
                ix.create(bind=bind)


def downgrade() -> None:
    # Корректирующая миграция необратима: откат не удаляет данные.
    pass
