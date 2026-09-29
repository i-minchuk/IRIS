"""add glossary_terms table

Revision ID: 5994aa0f7e9c
Revises: e918b47d939e
Create Date: 2026-09-29 10:30:34.241839

Защищённая миграция: на свежей БД таблицу может уже создать
guarded-миграция d1f2a3b4c5d6 (синхронизация с моделями) —
поэтому create выполняется только при отсутствии таблицы.

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = '5994aa0f7e9c'
down_revision: Union[str, None] = 'e918b47d939e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)

    if insp.has_table('glossary_terms'):
        return

    op.create_table('glossary_terms',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('term', sa.String(length=255), nullable=False),
    sa.Column('definition', sa.Text(), nullable=False),
    sa.Column('company_usage', sa.Text(), nullable=True),
    sa.Column('where_found', sa.String(length=500), nullable=True),
    sa.Column('department', sa.String(length=255), nullable=True),
    sa.Column('source', sa.String(length=50), nullable=False),
    sa.Column('document_id', sa.Integer(), nullable=True),
    sa.Column('project_id', sa.Integer(), nullable=True),
    sa.Column('created_by_id', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_glossary_terms_department', 'glossary_terms', ['department'], unique=False)
    op.create_index('ix_glossary_terms_project_id', 'glossary_terms', ['project_id'], unique=False)
    op.create_index('ix_glossary_terms_source', 'glossary_terms', ['source'], unique=False)
    op.create_index(op.f('ix_glossary_terms_term'), 'glossary_terms', ['term'], unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)

    if not insp.has_table('glossary_terms'):
        return

    op.drop_index(op.f('ix_glossary_terms_term'), table_name='glossary_terms')
    op.drop_index('ix_glossary_terms_source', table_name='glossary_terms')
    op.drop_index('ix_glossary_terms_project_id', table_name='glossary_terms')
    op.drop_index('ix_glossary_terms_department', table_name='glossary_terms')
    op.drop_table('glossary_terms')
