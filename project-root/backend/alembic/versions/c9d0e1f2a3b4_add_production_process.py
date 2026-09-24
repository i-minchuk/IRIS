"""add_production_process

Таблицы производственного процесса для вкладки «Стратегия» (Пр-во):
prod_departments, prod_employees, prod_process_nodes, prod_process_edges,
prod_problems. Схема процесса хранится в БД и редактируется через API.

Revision ID: c9d0e1f2a3b4
Revises: b8c9d0e1f2a3
Create Date: 2026-08-31

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c9d0e1f2a3b4'
down_revision: Union[str, None] = 'b8c9d0e1f2a3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


_TS_DEFAULT = sa.text('CURRENT_TIMESTAMP')


def _timestamps() -> list:
    return [
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=_TS_DEFAULT),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=_TS_DEFAULT),
    ]


def upgrade() -> None:
    op.create_table(
        'prod_departments',
        sa.Column('key', sa.String(50), nullable=False),
        sa.Column('label', sa.String(255), nullable=False),
        sa.Column('short_label', sa.String(50), nullable=False),
        sa.Column('color', sa.String(20), nullable=False),
        sa.Column('bg', sa.String(20), nullable=False),
        sa.Column('border', sa.String(20), nullable=False),
        sa.Column('lane_y', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('lane_h', sa.Integer(), nullable=False, server_default='130'),
        sa.Column('position', sa.Integer(), nullable=False, server_default='0'),
        *_timestamps(),
        sa.PrimaryKeyConstraint('key'),
    )

    op.create_table(
        'prod_employees',
        sa.Column('id', sa.String(50), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('role', sa.String(255), nullable=False),
        sa.Column('dept_key', sa.String(50), nullable=False),
        sa.Column('kpi_load', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('tasks', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('position', sa.Integer(), nullable=False, server_default='0'),
        *_timestamps(),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'prod_process_nodes',
        sa.Column('id', sa.String(50), nullable=False),
        sa.Column('label', sa.String(255), nullable=False),
        sa.Column('dept_key', sa.String(50), nullable=False),
        sa.Column('x', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('y', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('w', sa.Integer(), nullable=False, server_default='170'),
        sa.Column('h', sa.Integer(), nullable=False, server_default='76'),
        sa.Column('type', sa.String(20), nullable=False, server_default='task'),
        sa.Column('issue', sa.String(20), nullable=False, server_default='ok'),
        sa.Column('docs', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('employees', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('kpis', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('description', sa.Text(), nullable=False, server_default=''),
        sa.Column('avg_days', sa.Float(), nullable=False, server_default='0'),
        sa.Column('position', sa.Integer(), nullable=False, server_default='0'),
        *_timestamps(),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'prod_process_edges',
        sa.Column('id', sa.String(50), nullable=False),
        sa.Column('from_node', sa.String(50), nullable=False),
        sa.Column('to_node', sa.String(50), nullable=False),
        sa.Column('type', sa.String(20), nullable=False, server_default='sequence'),
        sa.Column('label', sa.String(100), nullable=True),
        sa.Column('position', sa.Integer(), nullable=False, server_default='0'),
        *_timestamps(),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'prod_problems',
        sa.Column('id', sa.String(50), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('severity', sa.String(20), nullable=False, server_default='warn'),
        sa.Column('tasks', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('description', sa.Text(), nullable=False, server_default=''),
        sa.Column('recommendation', sa.Text(), nullable=False, server_default=''),
        sa.Column('position', sa.Integer(), nullable=False, server_default='0'),
        *_timestamps(),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('prod_problems')
    op.drop_table('prod_process_edges')
    op.drop_table('prod_process_nodes')
    op.drop_table('prod_employees')
    op.drop_table('prod_departments')
