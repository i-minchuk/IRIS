"""add user link to prod employees

Связь сотрудников производственного процесса (prod_employees) с учётными
записями (users.id) для расчёта загрузки из модуля учёта времени.
Колонка nullable — существующие строки не требуют заполнения.

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-09-24

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'prod_employees',
        sa.Column('user_id', sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        'fk_prod_employees_user_id',
        'prod_employees', 'users',
        ['user_id'], ['id'],
    )


def downgrade() -> None:
    op.drop_constraint(
        'fk_prod_employees_user_id', 'prod_employees', type_='foreignkey'
    )
    op.drop_column('prod_employees', 'user_id')
