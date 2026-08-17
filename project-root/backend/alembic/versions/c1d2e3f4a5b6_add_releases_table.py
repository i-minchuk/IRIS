"""add releases table

Revision ID: c1d2e3f4a5b6
Revises: f2a3b4c5d6e7
Create Date: 2026-08-17 09:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c1d2e3f4a5b6'
down_revision: Union[str, None] = 'f2a3b4c5d6e7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'releases',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('version', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('branch', sa.String(length=255), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='planning'),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('checklist', sa.JSON(), nullable=True),
        sa.Column('approved_by', sa.JSON(), nullable=True),
        sa.Column('deployed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deployed_by', sa.String(length=255), nullable=True),
        sa.Column('rollback_info', sa.JSON(), nullable=True),
        sa.Column('planned_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('releases')
