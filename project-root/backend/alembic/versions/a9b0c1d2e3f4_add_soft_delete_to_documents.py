"""add soft delete to documents

Revision ID: a9b0c1d2e3f4
Revises: e5f6a7b8c9d0
Create Date: 2026-09-25 11:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a9b0c1d2e3f4'
down_revision: Union[str, None] = 'e5f6a7b8c9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'documents',
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='0'),
    )
    op.add_column(
        'documents',
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        'documents',
        sa.Column('deleted_by_id', sa.Integer(), nullable=True),
    )
    op.add_column(
        'documents',
        sa.Column('delete_reason', sa.String(length=500), nullable=True),
    )
    if op.get_context().dialect.name != 'sqlite':
        op.create_foreign_key(
            None, 'documents', 'users', ['deleted_by_id'], ['id']
        )
    op.create_index(
        'ix_doc_project_deleted', 'documents', ['project_id', 'is_deleted']
    )


def downgrade() -> None:
    op.drop_index('ix_doc_project_deleted', table_name='documents')
    if op.get_context().dialect.name != 'sqlite':
        op.drop_constraint(None, 'documents', type_='foreignkey')
    op.drop_column('documents', 'delete_reason')
    op.drop_column('documents', 'deleted_by_id')
    op.drop_column('documents', 'deleted_at')
    op.drop_column('documents', 'is_deleted')
