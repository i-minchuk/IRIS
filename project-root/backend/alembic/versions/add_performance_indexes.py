"""Add performance indexes

Revision ID: add_performance_indexes
Revises: 76a4efa5dc26
Create Date: 2024-XX-XX

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = 'add_performance_indexes'
down_revision = '76a4efa5dc26'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add indexes for performance optimization."""
    
    # Document indexes
    op.create_index('ix_doc_project_status', 'documents', ['project_id', 'status'])
    op.create_index('ix_doc_author_created', 'documents', ['author_id', 'created_at'])
    op.create_index('ix_doc_section', 'documents', ['section_id'])
    op.create_index('ix_doc_status', 'documents', ['status'])
    
    # Revision indexes
    op.create_index('ix_rev_document_created', 'revisions', ['document_id', 'created_at'])
    
    # Remark indexes
    op.create_index('ix_remark_document_status', 'remarks', ['document_id', 'status'])
    op.create_index('ix_remark_severity_created', 'remarks', ['severity', 'created_at'])
    op.create_index('ix_remark_document_status_severity', 'remarks', ['document_id', 'status', 'severity'])
    
    # TimeSession indexes (user_id, document_id, project_id, started_at already have single column indexes)
    op.create_index('ix_timesession_user_started', 'time_sessions', ['user_id', 'started_at'])
    op.create_index('ix_timesession_project_started', 'time_sessions', ['project_id', 'started_at'])
    op.create_index('ix_timesession_user_project', 'time_sessions', ['user_id', 'project_id'])


def downgrade() -> None:
    """Remove indexes."""
    
    # TimeSession indexes
    op.drop_index('ix_timesession_user_project', table_name='time_sessions')
    op.drop_index('ix_timesession_project_started', table_name='time_sessions')
    op.drop_index('ix_timesession_user_started', table_name='time_sessions')
    
    # Remark indexes
    op.drop_index('ix_remark_document_status_severity', table_name='remarks')
    op.drop_index('ix_remark_severity_created', table_name='remarks')
    op.drop_index('ix_remark_document_status', table_name='remarks')
    
    # Revision indexes
    op.drop_index('ix_rev_document_created', table_name='revisions')
    
    # Document indexes
    op.drop_index('ix_doc_status', table_name='documents')
    op.drop_index('ix_doc_section', table_name='documents')
    op.drop_index('ix_doc_author_created', table_name='documents')
    op.drop_index('ix_doc_project_status', table_name='documents')
