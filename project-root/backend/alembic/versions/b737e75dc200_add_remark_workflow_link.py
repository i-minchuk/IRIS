"""add_remark_workflow_link

Revision ID: b737e75dc200
Revises: a2297f006ed5
Create Date: 2026-05-28 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'b737e75dc200'
down_revision: Union[str, None] = 'a2297f006ed5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add workflow_instance_id to remarks
    op.add_column(
        'remarks',
        sa.Column('workflow_instance_id', sa.Integer(), nullable=True)
    )
    op.create_foreign_key(
        'fk_remarks_workflow_instance',
        'remarks',
        'workflow_instances',
        ['workflow_instance_id'],
        ['id'],
        ondelete='SET NULL'
    )

    # Add remark_id to workflow_instances
    op.add_column(
        'workflow_instances',
        sa.Column('remark_id', postgresql.UUID(as_uuid=True), nullable=True)
    )
    op.create_foreign_key(
        'fk_workflow_instances_remark',
        'workflow_instances',
        'remarks',
        ['remark_id'],
        ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    op.drop_constraint('fk_workflow_instances_remark', 'workflow_instances', type_='foreignkey')
    op.drop_column('workflow_instances', 'remark_id')

    op.drop_constraint('fk_remarks_workflow_instance', 'remarks', type_='foreignkey')
    op.drop_column('remarks', 'workflow_instance_id')
