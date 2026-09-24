"""add_purchase_request_number

Автонумерация заявок на закупку: srm_purchase_requests.number (ЗП-ГГГГ-NNN).
Существующие заявки получают номера по году создания и порядку id.

Revision ID: b8c9d0e1f2a3
Revises: a7b8c9d0e1f2
Create Date: 2026-08-27

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b8c9d0e1f2a3'
down_revision: Union[str, None] = 'a7b8c9d0e1f2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('srm_purchase_requests', sa.Column('number', sa.String(100), nullable=True))

    # Backfill: ЗП-<год создания>-<порядковый номер в году>
    bind = op.get_bind()
    rows = bind.execute(
        sa.text('SELECT id, created_at FROM srm_purchase_requests ORDER BY id')
    ).fetchall()
    seq_by_year: dict[int, int] = {}
    for row_id, created_at in rows:
        year = created_at.year if created_at else 2026
        seq_by_year[year] = seq_by_year.get(year, 0) + 1
        number = f'ЗП-{year}-{seq_by_year[year]:03d}'
        bind.execute(
            sa.text('UPDATE srm_purchase_requests SET number = :number WHERE id = :id'),
            {'number': number, 'id': row_id},
        )


def downgrade() -> None:
    op.drop_column('srm_purchase_requests', 'number')
