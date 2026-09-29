"""add standards and document standard_ids

Revision ID: 7ba93d06b54d
Revises: 5994aa0f7e9c
Create Date: 2026-09-29 10:38:24.073327

Защищённая миграция: на свежей БД таблицу standards может уже создать
guarded-миграция d1f2a3b4c5d6 (синхронизация с моделями) —
таблица и индексы создаются только при отсутствии, колонка
documents.standard_ids — только если её ещё нет.

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = '7ba93d06b54d'
down_revision: Union[str, None] = '5994aa0f7e9c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)

    if not insp.has_table('standards'):
        op.create_table('standards',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('code', sa.String(length=100), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('file_path', sa.String(length=500), nullable=True),
        sa.Column('file_name', sa.String(length=255), nullable=True),
        sa.Column('file_size', sa.Integer(), nullable=True),
        sa.Column('requirements', sa.JSON(), nullable=False),
        sa.Column('source', sa.String(length=50), nullable=False),
        sa.Column('created_by_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_standards_code'), 'standards', ['code'], unique=False)
        op.create_index('ix_standards_source', 'standards', ['source'], unique=False)

    if 'standard_ids' not in {c['name'] for c in insp.get_columns('documents')}:
        op.add_column('documents', sa.Column('standard_ids', sa.JSON(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)

    if 'standard_ids' in {c['name'] for c in insp.get_columns('documents')}:
        op.drop_column('documents', 'standard_ids')

    if not insp.has_table('standards'):
        return

    op.drop_index('ix_standards_source', table_name='standards')
    op.drop_index(op.f('ix_standards_code'), table_name='standards')
    op.drop_table('standards')
