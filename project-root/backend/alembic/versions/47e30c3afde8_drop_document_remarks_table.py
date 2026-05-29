"""Drop document_remarks table.

Revision ID: 47e30c3afde8
Revises: a2297f006ed5
Create Date: 2026-05-27 10:44:31
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '47e30c3afde8'
down_revision: Union[str, None] = 'a2297f006ed5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Drop legacy document_remarks table and related indexes."""
    # Drop indexes first
    op.drop_index('ix_remark_document_status', table_name='document_remarks')
    op.drop_index('ix_remark_severity_created', table_name='document_remarks')
    op.drop_index('ix_remark_document_status_severity', table_name='document_remarks')
    # Drop the table
    op.drop_table('document_remarks')


def downgrade() -> None:
    """Recreate document_remarks table."""
    op.create_table(
        'document_remarks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('document_id', sa.Integer(), nullable=False),
        sa.Column('revision_id', sa.Integer(), nullable=True),
        sa.Column('remark_type', sa.String(50), nullable=False),
        sa.Column('source_author_id', sa.Integer(), nullable=True),
        sa.Column('source_organization', sa.String(255), nullable=True),
        sa.Column('source_department', sa.String(100), nullable=True),
        sa.Column('source_role', sa.String(100), nullable=True),
        sa.Column('target_page', sa.Integer(), nullable=True),
        sa.Column('target_coordinates', sa.JSON(), nullable=True),
        sa.Column('target_element_id', sa.String(100), nullable=True),
        sa.Column('target_text_selection', sa.Text(), nullable=True),
        sa.Column('target_screenshot', sa.String(500), nullable=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('severity', sa.String(20), nullable=False),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('status', sa.String(50), nullable=False, server_default='new'),
        sa.Column('workflow_history', sa.JSON(), nullable=True),
        sa.Column('resolution_action', sa.String(50), nullable=True),
        sa.Column('resolution_revision_id', sa.Integer(), nullable=True),
        sa.Column('response', sa.Text(), nullable=True),
        sa.Column('evidence', sa.JSON(), nullable=True),
        sa.Column('confirmed_by_customer', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('confirmed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('deadline', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id']),
        sa.ForeignKeyConstraint(['revision_id'], ['revisions.id']),
        sa.ForeignKeyConstraint(['source_author_id'], ['users.id']),
        sa.ForeignKeyConstraint(['resolution_revision_id'], ['revisions.id']),
    )
    op.create_index('ix_remark_document_status', 'document_remarks', ['document_id', 'status'])
    op.create_index('ix_remark_severity_created', 'document_remarks', ['severity', 'created_at'])
    op.create_index('ix_remark_document_status_severity', 'document_remarks', ['document_id', 'status', 'severity'])
