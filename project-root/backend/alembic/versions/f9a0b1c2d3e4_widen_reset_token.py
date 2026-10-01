"""widen users.reset_token to 512 chars

Revision ID: f9a0b1c2d3e4
Revises: b7c8d9e0f1a2
Create Date: 2026-10-01 12:30:00.000000

JWT reset-токен с claims iss/aud/jti длиннее 255 символов —
сброс пароля падал с StringDataRightTruncationError.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f9a0b1c2d3e4'
down_revision: Union[str, None] = 'b7c8d9e0f1a2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        'users',
        'reset_token',
        existing_type=sa.String(255),
        type_=sa.String(512),
        existing_nullable=True,
    )


def downgrade() -> None:
    op.alter_column(
        'users',
        'reset_token',
        existing_type=sa.String(512),
        type_=sa.String(255),
        existing_nullable=True,
    )
