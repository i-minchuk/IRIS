"""add partial index for overdue tasks

Revision ID: 604c20d8dad2
Revises: 5531966b21a6
Create Date: 2026-04-30 12:37:21.506428

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '604c20d8dad2'
down_revision: Union[str, None] = '5531966b21a6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        'idx_tasks_overdue_partial',
        'tasks',
        ['due_date'],
        postgresql_where=sa.text(
            "due_date < NOW() AND status NOT IN ('done', 'cancelled')"
        )
    )


def downgrade() -> None:
    op.drop_index('idx_tasks_overdue_partial', table_name='tasks')
