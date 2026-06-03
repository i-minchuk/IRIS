"""add_performance_indexes

Revision ID: afce4e728c03
Revises: e321f5ac15ec
Create Date: 2026-06-01 21:42:54.961457

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'afce4e728c03'
down_revision: Union[str, None] = 'e321f5ac15ec'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Use IF NOT EXISTS for idempotency
    op.execute("CREATE INDEX IF NOT EXISTS ix_doc_project_status_type ON documents (project_id, status, doc_type)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_tasks_project_status_assignee ON tasks (project_id, status, assignee_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_remarks_document_status ON remarks (document_id, status)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_approval_workflows_document_id ON approval_workflows (document_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_revisions_created_by ON revisions (created_by_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_revisions_approved_by ON revisions (approved_by_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_documents_locked_by ON documents (locked_by_id) WHERE locked_by_id IS NOT NULL")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_documents_locked_by")
    op.execute("DROP INDEX IF EXISTS idx_revisions_approved_by")
    op.execute("DROP INDEX IF EXISTS idx_revisions_created_by")
    op.execute("DROP INDEX IF EXISTS idx_approval_workflows_document_id")
    op.execute("DROP INDEX IF EXISTS ix_remarks_document_status")
    op.execute("DROP INDEX IF EXISTS ix_tasks_project_status_assignee")
    op.execute("DROP INDEX IF EXISTS ix_doc_project_status_type")
