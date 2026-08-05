"""add_calendar_events_table

Revision ID: a1b2c3d4e5f6
Revises: afce4e728c03
Create Date: 2026-07-23 09:38:04

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'afce4e728c03'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'calendar_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_global', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_calendar_events_user_id', 'calendar_events', ['user_id'])
    op.create_index('ix_calendar_events_date', 'calendar_events', ['date'])


def downgrade() -> None:
    op.drop_index('ix_calendar_events_date', table_name='calendar_events')
    op.drop_index('ix_calendar_events_user_id', table_name='calendar_events')
    op.drop_table('calendar_events')
