"""add_srm_tables

Revision ID: e3f4a5b6c7d8
Revises: d2e3f4a5b6c7
Create Date: 2026-08-17 08:52:06

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e3f4a5b6c7d8'
down_revision: Union[str, None] = 'd2e3f4a5b6c7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'srm_suppliers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('inn', sa.String(20), nullable=False),
        sa.Column('kpp', sa.String(20), nullable=True),
        sa.Column('ogrn', sa.String(20), nullable=True),
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('status', sa.String(50), nullable=False, server_default='draft'),
        sa.Column('rating', sa.Float(), nullable=False, server_default='0'),
        sa.Column('contact_name', sa.String(255), nullable=False),
        sa.Column('contact_email', sa.String(255), nullable=False),
        sa.Column('contact_phone', sa.String(50), nullable=False),
        sa.Column('address', sa.String(500), nullable=False),
        sa.Column('website', sa.String(255), nullable=True),
        sa.Column('verified_by_legal', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('verified_by_accountant', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_srm_suppliers_status', 'srm_suppliers', ['status'])
    op.create_index('ix_srm_suppliers_category', 'srm_suppliers', ['category'])

    op.create_table(
        'srm_purchase_requests',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('project_name', sa.String(255), nullable=False),
        sa.Column('status', sa.String(50), nullable=False, server_default='draft'),
        sa.Column('requester', sa.String(255), nullable=False),
        sa.Column('amount', sa.Numeric(15, 2), nullable=False),
        sa.Column('currency', sa.String(3), nullable=False, server_default='RUB'),
        sa.Column('priority', sa.String(20), nullable=False, server_default='medium'),
        sa.Column('deadline', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_srm_purchase_requests_status', 'srm_purchase_requests', ['status'])
    op.create_index('ix_srm_purchase_requests_project_id', 'srm_purchase_requests', ['project_id'])

    op.create_table(
        'srm_contracts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('number', sa.String(100), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('supplier_id', sa.Integer(), nullable=False),
        sa.Column('supplier_name', sa.String(255), nullable=False),
        sa.Column('status', sa.String(50), nullable=False, server_default='draft'),
        sa.Column('amount', sa.Numeric(15, 2), nullable=False),
        sa.Column('currency', sa.String(3), nullable=False, server_default='RUB'),
        sa.Column('start_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('end_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('project_name', sa.String(255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['supplier_id'], ['srm_suppliers.id']),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_srm_contracts_status', 'srm_contracts', ['status'])
    op.create_index('ix_srm_contracts_supplier_id', 'srm_contracts', ['supplier_id'])

    op.create_table(
        'srm_orders',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('number', sa.String(100), nullable=False),
        sa.Column('contract_id', sa.Integer(), nullable=False),
        sa.Column('supplier_name', sa.String(255), nullable=False),
        sa.Column('status', sa.String(50), nullable=False, server_default='draft'),
        sa.Column('amount', sa.Numeric(15, 2), nullable=False),
        sa.Column('currency', sa.String(3), nullable=False, server_default='RUB'),
        sa.Column('order_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('delivery_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('project_name', sa.String(255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['contract_id'], ['srm_contracts.id']),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_srm_orders_status', 'srm_orders', ['status'])
    op.create_index('ix_srm_orders_contract_id', 'srm_orders', ['contract_id'])

    op.create_table(
        'srm_invoices',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('number', sa.String(100), nullable=False),
        sa.Column('supplier_name', sa.String(255), nullable=False),
        sa.Column('contract_id', sa.Integer(), nullable=False),
        sa.Column('order_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(50), nullable=False, server_default='received'),
        sa.Column('amount', sa.Numeric(15, 2), nullable=False),
        sa.Column('currency', sa.String(3), nullable=False, server_default='RUB'),
        sa.Column('issue_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('due_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('paid_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['contract_id'], ['srm_contracts.id']),
        sa.ForeignKeyConstraint(['order_id'], ['srm_orders.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_srm_invoices_status', 'srm_invoices', ['status'])
    op.create_index('ix_srm_invoices_contract_id', 'srm_invoices', ['contract_id'])


def downgrade() -> None:
    op.drop_index('ix_srm_invoices_contract_id', table_name='srm_invoices')
    op.drop_index('ix_srm_invoices_status', table_name='srm_invoices')
    op.drop_table('srm_invoices')

    op.drop_index('ix_srm_orders_contract_id', table_name='srm_orders')
    op.drop_index('ix_srm_orders_status', table_name='srm_orders')
    op.drop_table('srm_orders')

    op.drop_index('ix_srm_contracts_supplier_id', table_name='srm_contracts')
    op.drop_index('ix_srm_contracts_status', table_name='srm_contracts')
    op.drop_table('srm_contracts')

    op.drop_index('ix_srm_purchase_requests_project_id', table_name='srm_purchase_requests')
    op.drop_index('ix_srm_purchase_requests_status', table_name='srm_purchase_requests')
    op.drop_table('srm_purchase_requests')

    op.drop_index('ix_srm_suppliers_category', table_name='srm_suppliers')
    op.drop_index('ix_srm_suppliers_status', table_name='srm_suppliers')
    op.drop_table('srm_suppliers')
