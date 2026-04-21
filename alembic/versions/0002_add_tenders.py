"""Add tenders and tender_documents tables.

Revision ID: 0002
Revises: 0001
Create Date: 2026-04-10 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


revision = '0002'
down_revision = '0001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Tenders table
    op.create_table(
        'tenders',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.Text(), nullable=False),
        sa.Column('customer', sa.Text(), nullable=False),
        sa.Column('deadline_date', sa.Date(), nullable=False),
        sa.Column('status', sa.Text(), nullable=False, server_default='draft'),
        sa.Column('vdr_required', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('otk_required', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('logistics_complexity', sa.Text(), nullable=False, server_default='normal'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('required_disciplines', sa.JSON(), nullable=True),
        sa.Column('team_size', sa.Integer(), nullable=True),
        sa.Column('expected_review_rounds', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('expected_remark_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('assessed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('assessment_result', sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_tenders_status', 'tenders', ['status'])
    op.create_index('idx_tenders_created_at', 'tenders', ['created_at'])

    # Tender documents table
    op.create_table(
        'tender_documents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tender_id', sa.Integer(), nullable=False),
        sa.Column('doc_type', sa.Text(), nullable=False),
        sa.Column('count', sa.Integer(), nullable=False),
        sa.Column('hours_per_doc', sa.Numeric(6, 2), nullable=False),
        sa.Column('discipline', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['tender_id'], ['tenders.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_tender_documents_tender', 'tender_documents', ['tender_id'])


def downgrade() -> None:
    op.drop_table('tender_documents')
    op.drop_table('tenders')
