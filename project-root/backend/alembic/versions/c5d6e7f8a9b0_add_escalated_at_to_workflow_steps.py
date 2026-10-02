"""add escalated_at to workflow_steps

Revision ID: c5d6e7f8a9b0
Revises: e4ba93e464e4
Create Date: 2026-10-02 14:00:00.000000

Этап 3 документооборота: дедлайны и эскалация —
поле escalated_at фиксирует отправку уведомления
о просроченном шаге (один раз на шаг).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c5d6e7f8a9b0'
down_revision: Union[str, None] = 'e4ba93e464e4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'workflow_steps',
        sa.Column('escalated_at', sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('workflow_steps', 'escalated_at')
