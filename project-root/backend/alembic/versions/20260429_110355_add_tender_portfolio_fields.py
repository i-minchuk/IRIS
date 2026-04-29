"""add tender portfolio fields

Revision ID: 20260429_110355
Revises: deb26813c38d
Create Date: 2026-04-29 11:03:55

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20260429_110355'
down_revision: Union[str, None] = 'deb26813c38d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add portfolio fields to tenders table
    op.add_column('tenders', sa.Column('stage', sa.String(50), nullable=False, server_default='new'))
    op.add_column('tenders', sa.Column('nmc', sa.Float(), nullable=True))
    op.add_column('tenders', sa.Column('our_price', sa.Float(), nullable=True))
    op.add_column('tenders', sa.Column('margin_pct', sa.Float(), nullable=True))
    op.add_column('tenders', sa.Column('probability', sa.Integer(), nullable=True))
    op.add_column('tenders', sa.Column('platform', sa.String(100), nullable=True))
    op.add_column('tenders', sa.Column('region', sa.String(100), nullable=True))
    op.add_column('tenders', sa.Column('responsible_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True))
    op.add_column('tenders', sa.Column('auction_end_time', sa.DateTime(timezone=True), nullable=True))
    op.add_column('tenders', sa.Column('loss_reason', sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column('tenders', 'stage')
    op.drop_column('tenders', 'nmc')
    op.drop_column('tenders', 'our_price')
    op.drop_column('tenders', 'margin_pct')
    op.drop_column('tenders', 'probability')
    op.drop_column('tenders', 'platform')
    op.drop_column('tenders', 'region')
    op.drop_column('tenders', 'responsible_id')
    op.drop_column('tenders', 'auction_end_time')
    op.drop_column('tenders', 'loss_reason')
