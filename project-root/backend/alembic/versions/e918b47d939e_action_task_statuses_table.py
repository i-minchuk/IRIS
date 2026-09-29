"""action_task_statuses table

Revision ID: e918b47d939e
Revises: d1f2a3b4c5d6
Create Date: 2026-09-29 09:53:01.055561

Защищённая миграция: на свежей БД таблицу может уже создать
guarded-миграция d1f2a3b4c5d6 (синхронизация с моделями) —
поэтому create выполняется только при отсутствии таблицы.

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = 'e918b47d939e'
down_revision: Union[str, None] = 'd1f2a3b4c5d6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)

    if insp.has_table('action_task_statuses'):
        return

    op.create_table('action_task_statuses',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('task_key', sa.String(length=100), nullable=False),
    sa.Column('status', sa.String(length=20), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id', 'task_key', name='uq_action_task_status_user_key')
    )


def downgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)

    if not insp.has_table('action_task_statuses'):
        return

    op.drop_table('action_task_statuses')
