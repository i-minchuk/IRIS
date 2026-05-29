"""add ai classification to documents

Revision ID: 738e5abe6290
Revises: 7a320fc846fe
Create Date: 2026-05-28 21:45:18.015428

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '738e5abe6290'
down_revision: Union[str, None] = '7a320fc846fe'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('documents', sa.Column('ai_classified_type', sa.String(length=50), nullable=True))
    op.add_column('documents', sa.Column('ai_confidence', sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column('documents', 'ai_confidence')
    op.drop_column('documents', 'ai_classified_type')
