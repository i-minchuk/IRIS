"""add reminded_at to workflow_steps

Revision ID: b6c7d8e9f0a1
Revises: c5d6e7f8a9b0
Create Date: 2026-10-02 15:00:00.000000

Этап 4 документооборота: мягкое напоминание за 24 ч до дедлайна —
поле reminded_at фиксирует отправку напоминания (один раз на шаг).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b6c7d8e9f0a1'
down_revision: Union[str, None] = 'c5d6e7f8a9b0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'workflow_steps',
        sa.Column('reminded_at', sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('workflow_steps', 'reminded_at')
