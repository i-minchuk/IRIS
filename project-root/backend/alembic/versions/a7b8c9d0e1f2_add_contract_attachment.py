"""add_contract_attachment

Прикрепление файла к договору: srm_contracts.attachment_name / attachment_stored.

Revision ID: a7b8c9d0e1f2
Revises: f5a6b7c8d9e0
Create Date: 2026-08-26

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a7b8c9d0e1f2'
down_revision: Union[str, None] = 'f5a6b7c8d9e0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('srm_contracts', sa.Column('attachment_name', sa.String(255), nullable=True))
    op.add_column('srm_contracts', sa.Column('attachment_stored', sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column('srm_contracts', 'attachment_stored')
    op.drop_column('srm_contracts', 'attachment_name')
