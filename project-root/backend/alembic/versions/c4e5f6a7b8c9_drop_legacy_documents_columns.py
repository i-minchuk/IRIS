"""drop legacy documents columns (guarded)

Revision ID: c4e5f6a7b8c9
Revises: f849b28f11d6
Create Date: 2026-09-29 13:35:00.000000

Удаляет легаси-колонки таблицы documents, отсутствующие в модели
(title, version, document_type, file_path, created_by_id и их FK/индексы).
Все операции защищены проверками существования: на свежей БД (где
колонки создали старые миграции) они удаляются, на БД без них —
безопасный no-op. Индекс ix_documents_document_type удаляется вместе
с колонкой document_type автоматически.

"""
from typing import Sequence, Union

from alembic import op
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision: str = 'c4e5f6a7b8c9'
down_revision: Union[str, None] = 'f849b28f11d6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

LEGACY_COLUMNS = ('title', 'version', 'document_type', 'file_path', 'created_by_id')


def upgrade() -> None:
    bind = op.get_bind()
    insp = inspect(bind)

    if not insp.has_table('documents'):
        return

    db_cols = {c['name'] for c in insp.get_columns('documents')}

    # FK created_by_id → users (если ещё существует)
    if 'created_by_id' in db_cols:
        db_fks = {
            fk['name']
            for fk in insp.get_foreign_keys('documents')
            if fk['constrained_columns'] == ['created_by_id']
        }
        for fk_name in db_fks:
            if fk_name:
                op.drop_constraint(fk_name, 'documents', type_='foreignkey')

    for col in LEGACY_COLUMNS:
        if col in db_cols:
            op.drop_column('documents', col)


def downgrade() -> None:
    # Корректирующая миграция необратима: откат не восстанавливает данные.
    pass
