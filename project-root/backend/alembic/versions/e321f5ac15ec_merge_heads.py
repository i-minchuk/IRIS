"""merge_heads

Revision ID: e321f5ac15ec
Revises: 89eabce58d91, c89ce55ae579
Create Date: 2026-05-31 16:18:31.706529

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e321f5ac15ec'
down_revision: Union[str, None] = ('89eabce58d91', 'c89ce55ae579')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
