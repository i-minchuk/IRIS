"""add indexes on foreign keys batch 2

Revision ID: 582037ccf289
Revises: 5778a575f958
Create Date: 2026-05-28 19:26:57.334452

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '582037ccf289'
down_revision: Union[str, None] = '5778a575f958'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # tenders
    op.create_index('idx_tenders_project_id', 'tenders', ['project_id'])

    # archive_entries
    op.create_index('idx_archive_entries_author_id', 'archive_entries', ['author_id'])

    # archive_materials
    op.create_index('idx_archive_materials_entry_id', 'archive_materials', ['entry_id'])

    # archive_constructions
    op.create_index('idx_archive_constructions_entry_id', 'archive_constructions', ['entry_id'])

    # workflow_steps
    op.create_index('idx_workflow_steps_instance_id', 'workflow_steps', ['instance_id'])

    # workflow_comments
    op.create_index('idx_workflow_comments_step_id', 'workflow_comments', ['step_id'])
    op.create_index('idx_workflow_comments_author_id', 'workflow_comments', ['user_id'])

    # workflow_audit_log
    op.create_index('idx_workflow_audit_log_instance_id', 'workflow_audit_log', ['instance_id'])


def downgrade() -> None:
    # workflow_audit_log
    op.drop_index('idx_workflow_audit_log_instance_id', table_name='workflow_audit_log')

    # workflow_comments
    op.drop_index('idx_workflow_comments_author_id', table_name='workflow_comments')
    op.drop_index('idx_workflow_comments_step_id', table_name='workflow_comments')

    # workflow_steps
    op.drop_index('idx_workflow_steps_instance_id', table_name='workflow_steps')

    # archive_constructions
    op.drop_index('idx_archive_constructions_entry_id', table_name='archive_constructions')

    # archive_materials
    op.drop_index('idx_archive_materials_entry_id', table_name='archive_materials')

    # archive_entries
    op.drop_index('idx_archive_entries_author_id', table_name='archive_entries')

    # tenders
    op.drop_index('idx_tenders_project_id', table_name='tenders')
