"""add_file_path_to_revisions

Revision ID: e1f2g3h4i5j6
Revises: a1b2c3d4e5f6
Create Date: 2026-07-24 12:22:47

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e1f2g3h4i5j6'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'revisions',
        sa.Column('file_path', sa.String(length=500), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('revisions', 'file_path')
