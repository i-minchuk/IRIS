"""add birthdate to users

Revision ID: f1a2b3c4d5e6
Revises: f9a0b1c2d3e4
Create Date: 2026-10-01 15:35:00.000000

Дата рождения пользователя — для календаря дней рождения
(эндпоинт /calendar/birthdays раньше всегда возвращал []).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, None] = 'f9a0b1c2d3e4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column('birthdate', sa.Date(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('users', 'birthdate')
