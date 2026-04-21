"""Add project_metrics table for storing calculated project metrics.

Revision ID: 0003
Revises: 0002
Create Date: 2026-04-10 12:00:00.000000

This migration adds a table for storing project metrics (SPI, CPI, risk_level, etc.)
that are calculated by recalculate_project_metrics().
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0003'
down_revision = '0002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add project_metrics table."""
    
    # Create project_metrics table for storing calculated metrics
    op.create_table(
        'project_metrics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('calculated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('total_tasks', sa.Integer(), nullable=False),
        sa.Column('completed_tasks', sa.Integer(), nullable=False),
        sa.Column('in_progress_tasks', sa.Integer(), nullable=False),
        sa.Column('blocked_tasks', sa.Integer(), nullable=False),
        sa.Column('not_started_tasks', sa.Integer(), nullable=False),
        sa.Column('spi', sa.Numeric(5, 4), nullable=False),
        sa.Column('cpi', sa.Numeric(5, 4), nullable=False),
        sa.Column('risk_level', sa.Text(), nullable=False),
        sa.Column('critical_tasks', sa.Integer(), nullable=False),
        sa.Column('overdue_tasks', sa.Integer(), nullable=False),
        sa.Column('total_planned_hours', sa.Numeric(12, 2), nullable=True),
        sa.Column('completed_hours', sa.Numeric(12, 2), nullable=True),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    
    # Create indexes for efficient queries
    op.create_index('idx_project_metrics_project', 'project_metrics', ['project_id'])
    op.create_index('idx_project_metrics_calculated', 'project_metrics', ['calculated_at'])
    op.create_index('idx_project_metrics_project_latest', 'project_metrics', ['project_id', 'calculated_at'])
    
    # Set timezone for this session (not database-level, as that's not portable)
    # The database connection already sets timezone via _configure_connection
    # This is just a session-level fallback
    op.execute("SET TIME ZONE 'UTC'")


def downgrade() -> None:
    """Drop project_metrics table."""
    op.drop_index('idx_project_metrics_project_latest', 'project_metrics')
    op.drop_index('idx_project_metrics_calculated', 'project_metrics')
    op.drop_index('idx_project_metrics_project', 'project_metrics')
    op.drop_table('project_metrics')