"""add attachment columns to support tickets (guarded)

Revision ID: e6f7a8b9c0d1
Revises: d5e6f7a8b9c0
Create Date: 2026-09-29 15:40:00.000000

Добавляет колонки вложения (скриншот) в support_tickets:
attachment_name (оригинальное имя файла) и attachment_stored
(имя файла в хранилище). Защищена проверками существования —
на БД без колонок добавляет, с колонками — безопасный no-op.

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = 'e6f7a8b9c0d1'
down_revision: Union[str, None] = 'd5e6f7a8b9c0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)

    if not insp.has_table('support_tickets'):
        return

    db_cols = {c['name'] for c in insp.get_columns('support_tickets')}
    if 'attachment_name' not in db_cols:
        op.add_column(
            'support_tickets',
            sa.Column('attachment_name', sa.String(length=255), nullable=True),
        )
    if 'attachment_stored' not in db_cols:
        op.add_column(
            'support_tickets',
            sa.Column('attachment_stored', sa.String(length=500), nullable=True),
        )


def downgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)

    if not insp.has_table('support_tickets'):
        return

    db_cols = {c['name'] for c in insp.get_columns('support_tickets')}
    if 'attachment_stored' in db_cols:
        op.drop_column('support_tickets', 'attachment_stored')
    if 'attachment_name' in db_cols:
        op.drop_column('support_tickets', 'attachment_name')
