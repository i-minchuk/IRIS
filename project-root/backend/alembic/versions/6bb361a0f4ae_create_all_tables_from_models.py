"""create_all_tables_from_models

Revision ID: 6bb361a0f4ae
Revises: 604c20d8dad2
Create Date: 2026-05-05 11:52:55.862318

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '6bb361a0f4ae'
down_revision: Union[str, None] = 'bb738b9eb80a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None




def upgrade() -> None:
    # Дубликат bb738b9eb80a_initial_schema: те же 39 таблиц.
    # На чистой БД падала с DuplicateTableError, на существующих —
    # никогда не применялась успешно. Обезврежена, цепочка ревизий сохранена.
    pass


def downgrade() -> None:
    pass
