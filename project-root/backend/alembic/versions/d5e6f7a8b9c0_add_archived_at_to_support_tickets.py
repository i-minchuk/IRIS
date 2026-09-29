"""add archived_at to support tickets (guarded)

Revision ID: d5e6f7a8b9c0
Revises: c4e5f6a7b8c9
Create Date: 2026-09-29 14:30:00.000000

Добавляет колонку archived_at в support_tickets для архива закрытых
тикетов. Защищена проверкой существования — на БД без колонки
добавляет, на БД с колонкой — безопасный no-op.

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = 'd5e6f7a8b9c0'
down_revision: Union[str, None] = 'c4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)

    if not insp.has_table('support_tickets'):
        return

    db_cols = {c['name'] for c in insp.get_columns('support_tickets')}
    if 'archived_at' not in db_cols:
        op.add_column(
            'support_tickets',
            sa.Column('archived_at', sa.DateTime(timezone=True), nullable=True),
        )


def downgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)

    if not insp.has_table('support_tickets'):
        return

    db_cols = {c['name'] for c in insp.get_columns('support_tickets')}
    if 'archived_at' in db_cols:
        op.drop_column('support_tickets', 'archived_at')
