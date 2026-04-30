"""add_remarks_tables

Revision ID: a3d538911e15
Revises: d373ba5e5a78
Create Date: 2026-04-29 17:26:46.213062

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a3d538911e15'
down_revision: Union[str, None] = 'd373ba5e5a78'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Remark Tags
    op.create_table('remark_tags',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('color', sa.String(length=20), default='#CBD5E0'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    
    # Remarks
    op.create_table('remarks',
        sa.Column('id', sa.UUID(as_uuid=True), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=True),
        sa.Column('document_id', sa.Integer(), nullable=True),
        sa.Column('revision_id', sa.Integer(), nullable=True),
        sa.Column('workflow_step_id', sa.Integer(), nullable=True),
        
        sa.Column('source', sa.Enum('INTERNAL', 'CUSTOMER', 'REGULATORY', 'WORKFLOW', 'AUDIT', 'MANUAL', name='remarksource'), nullable=False),
        sa.Column('status', sa.Enum('NEW', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'DEFERRED', 'CLOSED', name='remarkstatus'), nullable=False),
        sa.Column('priority', sa.Enum('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', name='remarkpriority'), nullable=False),
        sa.Column('category', sa.Enum('DESIGN_ERROR', 'DISCREPANCY', 'INCOMPLETENESS', 'NORM_VIOLATION', 'CUSTOMER_REQUEST', 'OTHER', name='remarkcategory'), nullable=False),
        
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('location_ref', sa.String(length=255), nullable=True),
        
        sa.Column('author_id', sa.Integer(), nullable=False),
        sa.Column('assignee_id', sa.Integer(), nullable=True),
        
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column('resolution', sa.Text(), nullable=True),
        sa.Column('resolved_by', sa.Integer(), nullable=True),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        
        sa.Column('parent_id', sa.UUID(as_uuid=True), nullable=True),
        sa.Column('related_remark_ids', sa.ARRAY(sa.UUID(as_uuid=True)), default=list),
        
        sa.Column('attachments', sa.JSONB(), default=list),
        sa.Column('history', sa.JSONB(), default=list),
        
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['revision_id'], ['document_revisions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['workflow_step_id'], ['workflow_steps.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['author_id'], ['users.id']),
        sa.ForeignKeyConstraint(['assignee_id'], ['users.id']),
        sa.ForeignKeyConstraint(['resolved_by'], ['users.id']),
        sa.ForeignKeyConstraint(['parent_id'], ['remarks.id'], ondelete='CASCADE'),
        
        sa.PrimaryKeyConstraint('id')
    )
    
    # Remark Comments
    op.create_table('remark_comments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('remark_id', sa.UUID(as_uuid=True), nullable=False),
        sa.Column('author_id', sa.Integer(), nullable=False),
        sa.Column('text', sa.Text(), nullable=False),
        sa.Column('is_internal', sa.Boolean(), default=True, nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        
        sa.ForeignKeyConstraint(['remark_id'], ['remarks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['author_id'], ['users.id']),
        
        sa.PrimaryKeyConstraint('id')
    )
    
    # Remark Tag Links (many-to-many)
    op.create_table('remark_tag_links',
        sa.Column('remark_id', sa.UUID(as_uuid=True), nullable=False),
        sa.Column('tag_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['remark_id'], ['remarks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tag_id'], ['remark_tags.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('remark_id', 'tag_id')
    )
    
    # Create indexes
    op.create_index('ix_remarks_project_id', 'remarks', ['project_id'])
    op.create_index('ix_remarks_document_id', 'remarks', ['document_id'])
    op.create_index('ix_remarks_status', 'remarks', ['status'])
    op.create_index('ix_remarks_priority', 'remarks', ['priority'])
    op.create_index('ix_remarks_assignee_id', 'remarks', ['assignee_id'])
    op.create_index('ix_remark_comments_remark_id', 'remark_comments', ['remark_id'])


def downgrade() -> None:
    op.drop_index('ix_remark_comments_remark_id', table_name='remark_comments')
    op.drop_index('ix_remarks_assignee_id', table_name='remarks')
    op.drop_index('ix_remarks_priority', table_name='remarks')
    op.drop_index('ix_remarks_status', table_name='remarks')
    op.drop_index('ix_remarks_document_id', table_name='remarks')
    op.drop_index('ix_remarks_project_id', table_name='remarks')
    
    op.drop_table('remark_tag_links')
    op.drop_table('remark_comments')
    op.drop_table('remarks')
    op.drop_table('remark_tags')
