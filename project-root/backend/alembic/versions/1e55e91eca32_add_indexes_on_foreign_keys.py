"""add indexes on foreign keys

Revision ID: 1e55e91eca32
Revises: 6b7a78f95758
Create Date: 2026-05-28 18:23:44.862526

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '1e55e91eca32'
down_revision: Union[str, None] = '6b7a78f95758'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # documents
    op.create_index('idx_documents_stage_id', 'documents', ['stage_id'])
    op.create_index('idx_documents_kit_id', 'documents', ['kit_id'])
    op.create_index('idx_documents_section_id', 'documents', ['section_id'])
    op.create_index('idx_documents_operation_id', 'documents', ['operation_id'])
    op.create_index('idx_documents_author_id', 'documents', ['author_id'])
    op.create_index('idx_documents_checker_id', 'documents', ['checker_id'])
    op.create_index('idx_documents_approver_id', 'documents', ['approver_id'])

    # tasks
    op.create_index('idx_tasks_creator_id', 'tasks', ['creator_id'])
    op.create_index('idx_tasks_assignee_id', 'tasks', ['assignee_id'])
    op.create_index('idx_tasks_project_id', 'tasks', ['project_id'])

    # remarks
    op.create_index('idx_remarks_project_id', 'remarks', ['project_id'])
    op.create_index('idx_remarks_document_id', 'remarks', ['document_id'])
    op.create_index('idx_remarks_author_id', 'remarks', ['author_id'])

    # workflow_instances
    op.create_index('idx_wf_instances_template_id', 'workflow_instances', ['template_id'])
    op.create_index('idx_wf_instances_document_id', 'workflow_instances', ['document_id'])


def downgrade() -> None:
    # workflow_instances
    op.drop_index('idx_wf_instances_document_id', table_name='workflow_instances')
    op.drop_index('idx_wf_instances_template_id', table_name='workflow_instances')

    # remarks
    op.drop_index('idx_remarks_author_id', table_name='remarks')
    op.drop_index('idx_remarks_document_id', table_name='remarks')
    op.drop_index('idx_remarks_project_id', table_name='remarks')

    # tasks
    op.drop_index('idx_tasks_project_id', table_name='tasks')
    op.drop_index('idx_tasks_assignee_id', table_name='tasks')
    op.drop_index('idx_tasks_creator_id', table_name='tasks')

    # documents
    op.drop_index('idx_documents_approver_id', table_name='documents')
    op.drop_index('idx_documents_checker_id', table_name='documents')
    op.drop_index('idx_documents_author_id', table_name='documents')
    op.drop_index('idx_documents_operation_id', table_name='documents')
    op.drop_index('idx_documents_section_id', table_name='documents')
    op.drop_index('idx_documents_kit_id', table_name='documents')
    op.drop_index('idx_documents_stage_id', table_name='documents')
