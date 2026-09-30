"""add process_task_id to documents operations remarks

Revision ID: 3106d75e8451
Revises: e6f7a8b9c0d1
Create Date: 2026-09-30 14:00:40.780402

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3106d75e8451'
down_revision: Union[str, None] = 'e6f7a8b9c0d1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('documents', sa.Column('process_task_id', sa.String(length=50), nullable=True))
    op.create_index('ix_documents_process_task', 'documents', ['process_task_id'], unique=False)
    op.add_column('operations', sa.Column('process_task_id', sa.String(length=50), nullable=True))
    op.add_column('remarks', sa.Column('process_task_id', sa.String(length=50), nullable=True))


def downgrade() -> None:
    op.drop_column('remarks', 'process_task_id')
    op.drop_column('operations', 'process_task_id')
    op.drop_index('ix_documents_process_task', table_name='documents')
    op.drop_column('documents', 'process_task_id')
