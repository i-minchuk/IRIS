"""add ip_address to audit_logs

Revision ID: f2a3b4c5d6e7
Revises: e1f2g3h4i5j6
Create Date: 2026-08-16 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f2a3b4c5d6e7'
down_revision: Union[str, None] = 'e1f2g3h4i5j6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('audit_logs', sa.Column('ip_address', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('audit_logs', 'ip_address')
