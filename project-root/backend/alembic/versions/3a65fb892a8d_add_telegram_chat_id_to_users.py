"""add telegram_chat_id to users

Revision ID: 3a65fb892a8d
Revises: 738e5abe6290
Create Date: 2026-05-28 21:45:49.265324

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '3a65fb892a8d'
down_revision: Union[str, None] = '738e5abe6290'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('telegram_chat_id', sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'telegram_chat_id')
