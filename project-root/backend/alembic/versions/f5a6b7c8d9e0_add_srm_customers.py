"""add_srm_customers

Отдельное хранилище заказчиков (srm_customers), зеркалирующее srm_suppliers.
FK srm_contracts.supplier_id переносится на srm_customers.id
(договоры заключаются с заказчиками, а не с поставщиками).

Revision ID: f5a6b7c8d9e0
Revises: b2c3d4e5f6a8
Create Date: 2026-08-26

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f5a6b7c8d9e0'
down_revision: Union[str, None] = 'b2c3d4e5f6a8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


_CONTRACTS_COLUMNS = (
    'id, number, title, supplier_id, supplier_name, status, amount, currency, '
    'start_date, end_date, project_id, project_name, created_at, updated_at'
)


def _create_customers_table() -> None:
    op.create_table(
        'srm_customers',
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
    op.create_index('ix_srm_customers_status', 'srm_customers', ['status'])


def _rebuild_contracts_sqlite(referred_table: str) -> None:
    """SQLite не умеет ALTER FK — пересоздаём таблицу с новым FK."""
    op.execute('PRAGMA foreign_keys=OFF')
    op.execute(f"""
        CREATE TABLE srm_contracts_new (
            id INTEGER NOT NULL PRIMARY KEY,
            number VARCHAR(100) NOT NULL,
            title VARCHAR(255) NOT NULL,
            supplier_id INTEGER NOT NULL REFERENCES {referred_table}(id),
            supplier_name VARCHAR(255) NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'draft',
            amount NUMERIC(15, 2) NOT NULL,
            currency VARCHAR(3) NOT NULL DEFAULT 'RUB',
            start_date DATETIME,
            end_date DATETIME,
            project_id INTEGER NOT NULL REFERENCES projects(id),
            project_name VARCHAR(255) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
        )
    """)
    op.execute(f'INSERT INTO srm_contracts_new SELECT {_CONTRACTS_COLUMNS} FROM srm_contracts')
    op.execute('DROP TABLE srm_contracts')
    op.execute('ALTER TABLE srm_contracts_new RENAME TO srm_contracts')
    op.create_index('ix_srm_contracts_status', 'srm_contracts', ['status'])
    op.create_index('ix_srm_contracts_supplier_id', 'srm_contracts', ['supplier_id'])
    op.execute('PRAGMA foreign_keys=ON')


def _repoint_contracts_fk(referred_table: str, constraint_name: str) -> None:
    if op.get_bind().dialect.name == 'postgresql':
        old = 'srm_contracts_supplier_id_fkey' if referred_table == 'srm_customers' else constraint_name
        op.drop_constraint(old, 'srm_contracts', type_='foreignkey')
        op.create_foreign_key(
            constraint_name, 'srm_contracts', referred_table, ['supplier_id'], ['id']
        )
    else:
        _rebuild_contracts_sqlite(referred_table)


def upgrade() -> None:
    _create_customers_table()
    _repoint_contracts_fk('srm_customers', 'fk_srm_contracts_supplier_id_customers')


def downgrade() -> None:
    _repoint_contracts_fk('srm_suppliers', 'srm_contracts_supplier_id_fkey')
    op.drop_index('ix_srm_customers_status', table_name='srm_customers')
    op.drop_table('srm_customers')
