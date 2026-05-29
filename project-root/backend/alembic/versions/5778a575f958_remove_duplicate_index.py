"""remove duplicate index

Revision ID: 5778a575f958
Revises: 1e55e91eca32
Create Date: 2026-05-28 18:24:23.945652

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5778a575f958'
down_revision: Union[str, None] = '1e55e91eca32'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_index('idx_tasks_due_date', table_name='tasks')


def downgrade() -> None:
    op.create_index('idx_tasks_due_date', 'tasks', ['due_date', 'status'], unique=False, if_not_exists=True)
