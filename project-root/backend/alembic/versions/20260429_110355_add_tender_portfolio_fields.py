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
    # SQLite requires batch mode for adding columns
    with op.batch_alter_table('tenders', schema=None) as batch_op:
        batch_op.add_column(sa.Column('stage', sa.String(50), nullable=False, server_default='new'))
        batch_op.add_column(sa.Column('nmc', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('our_price', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('margin_pct', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('probability', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('platform', sa.String(100), nullable=True))
        batch_op.add_column(sa.Column('region', sa.String(100), nullable=True))
        batch_op.add_column(sa.Column('responsible_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('auction_end_time', sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column('loss_reason', sa.String(255), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('tenders', schema=None) as batch_op:
        batch_op.drop_column('loss_reason')
        batch_op.drop_column('auction_end_time')
        batch_op.drop_column('responsible_id')
        batch_op.drop_column('region')
        batch_op.drop_column('platform')
        batch_op.drop_column('probability')
        batch_op.drop_column('margin_pct')
        batch_op.drop_column('our_price')
        batch_op.drop_column('nmc')
        batch_op.drop_column('stage')
