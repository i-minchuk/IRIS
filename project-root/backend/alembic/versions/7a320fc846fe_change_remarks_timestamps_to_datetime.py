"""change remarks timestamps to datetime

Revision ID: 7a320fc846fe
Revises: 7641fb7b5dc3
Create Date: 2026-05-28 21:15:43.553373

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision: str = '7a320fc846fe'
down_revision: Union[str, None] = '7641fb7b5dc3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    dialect = conn.dialect.name

    if dialect == 'postgresql':
        op.execute("ALTER TABLE remarks ALTER COLUMN created_at TYPE TIMESTAMP USING created_at::TIMESTAMP")
        op.execute("ALTER TABLE remarks ALTER COLUMN updated_at TYPE TIMESTAMP USING updated_at::TIMESTAMP")
    else:
        # SQLite: recreate table with correct types
        op.execute("""
            CREATE TABLE remarks_new (
                id UUID PRIMARY KEY,
                project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
                document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
                revision_id INTEGER REFERENCES revisions(id) ON DELETE CASCADE,
                workflow_step_id INTEGER REFERENCES workflow_steps(id) ON DELETE SET NULL,
                workflow_instance_id INTEGER REFERENCES workflow_instances(id) ON DELETE SET NULL,
                source VARCHAR(50) NOT NULL DEFAULT 'internal',
                status VARCHAR(50) NOT NULL DEFAULT 'new',
                priority VARCHAR(50) NOT NULL DEFAULT 'medium',
                category VARCHAR(50) NOT NULL DEFAULT 'other',
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                location_ref VARCHAR(255),
                author_id INTEGER NOT NULL REFERENCES users(id),
                assignee_id INTEGER REFERENCES users(id),
                due_date VARCHAR(20),
                resolution TEXT,
                resolved_by INTEGER REFERENCES users(id),
                resolved_at TIMESTAMP,
                parent_id UUID REFERENCES remarks(id) ON DELETE CASCADE,
                related_remark_ids UUID[] DEFAULT '{}',
                attachments JSONB DEFAULT '[]',
                history JSONB DEFAULT '[]',
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)
        op.execute("""
            INSERT INTO remarks_new
            SELECT * FROM remarks
        """)
        op.execute("DROP TABLE remarks")
        op.execute("ALTER TABLE remarks_new RENAME TO remarks")


def downgrade() -> None:
    conn = op.get_bind()
    dialect = conn.dialect.name

    if dialect == 'postgresql':
        op.execute("ALTER TABLE remarks ALTER COLUMN created_at TYPE VARCHAR(35)")
        op.execute("ALTER TABLE remarks ALTER COLUMN updated_at TYPE VARCHAR(35)")
    else:
        # SQLite: recreate table with original types
        op.execute("""
            CREATE TABLE remarks_new (
                id UUID PRIMARY KEY,
                project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
                document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
                revision_id INTEGER REFERENCES revisions(id) ON DELETE CASCADE,
                workflow_step_id INTEGER REFERENCES workflow_steps(id) ON DELETE SET NULL,
                workflow_instance_id INTEGER REFERENCES workflow_instances(id) ON DELETE SET NULL,
                source VARCHAR(50) NOT NULL DEFAULT 'internal',
                status VARCHAR(50) NOT NULL DEFAULT 'new',
                priority VARCHAR(50) NOT NULL DEFAULT 'medium',
                category VARCHAR(50) NOT NULL DEFAULT 'other',
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                location_ref VARCHAR(255),
                author_id INTEGER NOT NULL REFERENCES users(id),
                assignee_id INTEGER REFERENCES users(id),
                due_date VARCHAR(20),
                resolution TEXT,
                resolved_by INTEGER REFERENCES users(id),
                resolved_at TIMESTAMP,
                parent_id UUID REFERENCES remarks(id) ON DELETE CASCADE,
                related_remark_ids UUID[] DEFAULT '{}',
                attachments JSONB DEFAULT '[]',
                history JSONB DEFAULT '[]',
                created_at VARCHAR(35) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at VARCHAR(35) NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """)
        op.execute("""
            INSERT INTO remarks_new
            SELECT * FROM remarks
        """)
        op.execute("DROP TABLE remarks")
        op.execute("ALTER TABLE remarks_new RENAME TO remarks")
