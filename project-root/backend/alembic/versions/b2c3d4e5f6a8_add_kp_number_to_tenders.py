"""add kp_number to tenders

Номер коммерческого предложения = номер тендера. Последовательный счёт
в течение календарного года: с 1 января нового года счётчик обнуляется.
Формат: «КП-<порядковый номер>-<год>».

Revision ID: b2c3d4e5f6a8
Revises: a1b2c3d4e5f7
Create Date: 2026-08-25
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "b2c3d4e5f6a8"
down_revision = "a1b2c3d4e5f7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("tenders", sa.Column("kp_number", sa.String(length=32), nullable=True))

    # Бэкфилл: пронумеровать существующие тендеры последовательно
    # внутри каждого года по дате создания.
    conn = op.get_bind()
    rows = conn.execute(
        sa.text("SELECT id, created_at FROM tenders WHERE kp_number IS NULL ORDER BY created_at, id")
    ).fetchall()
    counters: dict[int, int] = {}
    for row in rows:
        year = row[1].year if row[1] is not None else 1970
        counters[year] = counters.get(year, 0) + 1
        conn.execute(
            sa.text("UPDATE tenders SET kp_number = :kp WHERE id = :id"),
            {"kp": f"КП-{counters[year]}-{year}", "id": row[0]},
        )


def downgrade() -> None:
    op.drop_column("tenders", "kp_number")
