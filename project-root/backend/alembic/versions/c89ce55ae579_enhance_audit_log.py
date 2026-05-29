"""enhance audit log

Revision ID: c89ce55ae579
Revises: d056cccf8618
Create Date: 2026-05-28 22:58:38.289545

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c89ce55ae579'
down_revision: Union[str, None] = 'd056cccf8618'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('audit_logs', sa.Column('user_email', sa.String(), nullable=True))
    op.add_column('audit_logs', sa.Column('entity_name', sa.String(), nullable=True))
    op.add_column('audit_logs', sa.Column('user_agent', sa.String(), nullable=True))
    op.add_column('audit_logs', sa.Column('success', sa.Boolean(), server_default='true'))
    op.create_index('idx_audit_user', 'audit_logs', ['user_id'])
    op.create_index('idx_audit_action', 'audit_logs', ['action'])
    op.create_index('idx_audit_entity', 'audit_logs', ['entity_type', 'entity_id'])
    op.create_index('idx_audit_date', 'audit_logs', ['created_at'])


def downgrade() -> None:
    op.drop_index('idx_audit_date', table_name='audit_logs')
    op.drop_index('idx_audit_entity', table_name='audit_logs')
    op.drop_index('idx_audit_action', table_name='audit_logs')
    op.drop_index('idx_audit_user', table_name='audit_logs')
    op.drop_column('audit_logs', 'success')
    op.drop_column('audit_logs', 'user_agent')
    op.drop_column('audit_logs', 'entity_name')
    op.drop_column('audit_logs', 'user_email')
