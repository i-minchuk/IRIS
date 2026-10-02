"""add discipline to documents and workflow routing rules

Revision ID: e4ba93e464e4
Revises: f1a2b3c4d5e6
Create Date: 2026-10-02 12:54:04.856064

Содержит только целевые изменения (без накопленного дрейфа индексов/FK,
который autogenerate подмешивает из-за ручных правок схемы в dev-БД):
  * documents.discipline — код дисциплины документа (08/11/37/65/70/94/96)
  * workflow_routing_rules — сценарии маршрутизации (условия -> шаблон)
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'e4ba93e464e4'
down_revision: Union[str, None] = 'f1a2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'workflow_routing_rules',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=True),
        sa.Column('doc_type', sa.String(length=50), nullable=True),
        sa.Column('discipline', sa.String(length=10), nullable=True),
        sa.Column('template_id', sa.Integer(), nullable=False),
        sa.Column('priority', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['template_id'], ['workflow_templates.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        'idx_workflow_routing_rules_template',
        'workflow_routing_rules',
        ['template_id'],
        unique=False,
    )
    op.add_column('documents', sa.Column('discipline', sa.String(length=10), nullable=True))


def downgrade() -> None:
    op.drop_column('documents', 'discipline')
    op.drop_index('idx_workflow_routing_rules_template', table_name='workflow_routing_rules')
    op.drop_table('workflow_routing_rules')
