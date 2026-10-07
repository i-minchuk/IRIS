"""add_document_delegations

Таблица временного делегирования согласований документов:
пока делегирование активно, делегат согласует документы от имени
делегирующего. Авто-возврат — за счёт expires_at.

Revision ID: ffe7d2ef422e
Revises: b6c7d8e9f0a1
Create Date: 2026-10-07

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'ffe7d2ef422e'
down_revision: Union[str, None] = 'b6c7d8e9f0a1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'document_delegations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('delegate_id', sa.Integer(), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_by_id', sa.Integer(), nullable=True),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text('CURRENT_TIMESTAMP'),
        ),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['delegate_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        op.f('ix_document_delegations_delegate_id'),
        'document_delegations',
        ['delegate_id'],
        unique=False,
    )
    op.create_index(
        op.f('ix_document_delegations_user_id'),
        'document_delegations',
        ['user_id'],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f('ix_document_delegations_user_id'), table_name='document_delegations')
    op.drop_index(op.f('ix_document_delegations_delegate_id'), table_name='document_delegations')
    op.drop_table('document_delegations')
