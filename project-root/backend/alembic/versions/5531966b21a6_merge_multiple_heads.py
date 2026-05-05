"""merge multiple heads

Revision ID: 5531966b21a6
Revises: a3d538911e15, add_archive_tables, deb26813c38d
Create Date: 2026-04-30 12:36:59.509629

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5531966b21a6'
down_revision: Union[str, None] = ('a3d538911e15', 'add_archive_tables', 'deb26813c38d')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
