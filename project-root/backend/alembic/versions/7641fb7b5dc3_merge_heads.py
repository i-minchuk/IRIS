"""merge_heads

Revision ID: 7641fb7b5dc3
Revises: 47e30c3afde8, b737e75dc200
Create Date: 2026-05-28 20:01:14.131139

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7641fb7b5dc3'
down_revision: Union[str, None] = ('47e30c3afde8', 'b737e75dc200')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
