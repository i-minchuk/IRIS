"""add scope_items and standard_files to tenders

Revision ID: a1b2c3d4e5f7
Revises: e3f4a5b6c7d8
Create Date: 2026-08-24 14:30:00.000000

Тендеры — проектирование, не строительство:
- scope_items — состав работ (перечень шкафов НКУ, поставка оборудования, …),
  JSON-список строк;
- standard_files — вложения применяемых стандартов,
  JSON-список {standard, file_name, stored_name}.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f7'
down_revision: Union[str, None] = 'e3f4a5b6c7d8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'tenders',
        sa.Column('scope_items', sa.JSON(), server_default='[]', nullable=True),
    )
    op.add_column(
        'tenders',
        sa.Column('standard_files', sa.JSON(), server_default='[]', nullable=True),
    )


def downgrade() -> None:
    op.drop_column('tenders', 'standard_files')
    op.drop_column('tenders', 'scope_items')
