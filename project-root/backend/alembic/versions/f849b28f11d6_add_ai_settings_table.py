"""add_ai_settings_table

Revision ID: f849b28f11d6
Revises: 7ba93d06b54d
Create Date: 2026-09-29 11:18:19.942405

Защищённая миграция: на свежей БД таблицу может уже создать
guarded-миграция d1f2a3b4c5d6 (синхронизация с моделями) —
поэтому create выполняется только при отсутствии таблицы.

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = 'f849b28f11d6'
down_revision: Union[str, None] = '7ba93d06b54d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)

    if insp.has_table('ai_settings'):
        return

    op.create_table('ai_settings',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('key', sa.String(length=50), nullable=False),
    sa.Column('openai_api_key', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ai_settings_key'), 'ai_settings', ['key'], unique=True)


def downgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)

    if not insp.has_table('ai_settings'):
        return

    op.drop_index(op.f('ix_ai_settings_key'), table_name='ai_settings')
    op.drop_table('ai_settings')
