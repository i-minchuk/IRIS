"""add archive fields to projects

Revision ID: b7c8d9e0f1a2
Revises: 3106d75e8451
Create Date: 2026-09-30 16:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7c8d9e0f1a2'
down_revision: Union[str, None] = '3106d75e8451'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'projects',
        sa.Column('archived_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        'projects',
        sa.Column('archive_reason', sa.String(length=500), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('projects', 'archive_reason')
    op.drop_column('projects', 'archived_at')
