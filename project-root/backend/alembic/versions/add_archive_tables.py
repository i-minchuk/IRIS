"""add_archive_tables

Revision ID: add_archive_tables
Revises: 
Create Date: 2026-04-28 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'add_archive_tables'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create archive_entries table
    op.create_table(
        'archive_entries',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('entry_type', sa.Enum(
            'document', 'revision', 'remark', 'workflow', 'comment',
            'file_upload', 'project_event', 'external_communication',
            'meeting', 'decision', 'material', 'construction',
            'photo', 'calculation', 'certificate', 'handover',
            name='archivetype'
        ), nullable=False),
        sa.Column('source_table', sa.String(length=100), nullable=False),
        sa.Column('source_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('content_snapshot', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('author_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('occurred_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('tags', postgresql.ARRAY(sa.String()), nullable=False, server_default='{}'),
        sa.Column('search_vector', postgresql.TSVECTOR(), nullable=True),
        sa.Column('attachments', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='[]'),
        sa.Column('related_entry_ids', postgresql.ARRAY(postgresql.UUID(as_uuid=True)), nullable=False, server_default='{}'),
        sa.Column('is_pinned', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['author_id'], ['users.id'], ondelete='SET NULL'),
    )

    # Create archive_materials table
    op.create_table(
        'archive_materials',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('material_type', sa.Enum(
            'steel', 'concrete', 'reinforcement', 'insulation',
            'finishing', 'equipment', 'pipe', 'cable', 'other',
            name='materialtype'
        ), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('specification', sa.String(length=500), nullable=True),
        sa.Column('manufacturer', sa.String(length=255), nullable=True),
        sa.Column('quantity', sa.Numeric(precision=15, scale=3), nullable=True),
        sa.Column('unit', sa.String(length=50), nullable=True),
        sa.Column('used_in_constructions', postgresql.ARRAY(postgresql.UUID(as_uuid=True)), nullable=False, server_default='{}'),
        sa.Column('certificates', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='[]'),
        sa.Column('attached_files', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='[]'),
        sa.Column('entry_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['entry_id'], ['archive_entries.id'], ondelete='SET NULL'),
    )

    # Create archive_constructions table
    op.create_table(
        'archive_constructions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('construction_type', sa.Enum(
            'foundation', 'column', 'beam', 'slab', 'wall',
            'roof', 'frame', 'pipeline', 'electrical', 'other',
            name='constructiontype'
        ), nullable=False),
        sa.Column('designation', sa.String(length=100), nullable=True),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('materials_used', postgresql.ARRAY(postgresql.UUID(as_uuid=True)), nullable=False, server_default='{}'),
        sa.Column('documents_related', postgresql.ARRAY(postgresql.UUID(as_uuid=True)), nullable=False, server_default='{}'),
        sa.Column('status', sa.Enum(
            'planned', 'in_production', 'installed', 'tested', 'accepted', 'rejected',
            name='constructionstatus'
        ), nullable=False, server_default='planned'),
        sa.Column('installed_at', sa.Date(), nullable=True),
        sa.Column('tested_at', sa.Date(), nullable=True),
        sa.Column('accepted_at', sa.Date(), nullable=True),
        sa.Column('photos', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='[]'),
        sa.Column('entry_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['entry_id'], ['archive_entries.id'], ondelete='SET NULL'),
    )

    # Create archive_search_index table
    op.create_table(
        'archive_search_index',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('entry_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('material_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('construction_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('search_text', sa.Text(), nullable=False),
        sa.Column('weight', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('indexed_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['entry_id'], ['archive_entries.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['material_id'], ['archive_materials.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['construction_id'], ['archive_constructions.id'], ondelete='CASCADE'),
    )

    # Create indexes
    op.create_index('ix_archive_entries_project_id', 'archive_entries', ['project_id'])
    op.create_index('ix_archive_entries_entry_type', 'archive_entries', ['entry_type'])
    op.create_index('ix_archive_entries_occurred_at', 'archive_entries', ['occurred_at'])
    op.create_index('ix_archive_entries_search_vector', 'archive_entries', ['search_vector'], postgresql_using='gin')
    op.create_index('ix_archive_entries_is_pinned', 'archive_entries', ['is_pinned'])
    op.create_index('ix_archive_entries_is_deleted', 'archive_entries', ['is_deleted'])

    op.create_index('ix_archive_materials_project_id', 'archive_materials', ['project_id'])
    op.create_index('ix_archive_materials_material_type', 'archive_materials', ['material_type'])

    op.create_index('ix_archive_constructions_project_id', 'archive_constructions', ['project_id'])
    op.create_index('ix_archive_constructions_status', 'archive_constructions', ['status'])

    op.create_index('ix_archive_search_index_project_id', 'archive_search_index', ['project_id'])
    op.create_index('ix_archive_search_index_entry_id', 'archive_search_index', ['entry_id'])

    # Create trigger function for updating search_vector
    op.execute("""
        CREATE OR REPLACE FUNCTION update_archive_search_vector()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.search_vector := to_tsvector('russian', 
                COALESCE(NEW.title, '') || ' ' || 
                COALESCE(NEW.description, '') || ' ' || 
                COALESCE(array_to_string(NEW.tags, ' '), '')
            );
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)

    # Create trigger
    op.execute("""
        CREATE TRIGGER archive_search_vector_update
            BEFORE INSERT OR UPDATE OF title, description, tags ON archive_entries
            FOR EACH ROW
            EXECUTE FUNCTION update_archive_search_vector();
    """)


def downgrade() -> None:
    # Drop trigger
    op.execute("DROP TRIGGER IF EXISTS archive_search_vector_update ON archive_entries")
    op.execute("DROP FUNCTION IF EXISTS update_archive_search_vector()")

    # Drop tables
    op.drop_table('archive_search_index')
    op.drop_table('archive_constructions')
    op.drop_table('archive_materials')
    op.drop_table('archive_entries')

    # Drop enums
    op.execute("DROP TYPE IF EXISTS archivetype")
    op.execute("DROP TYPE IF EXISTS materialtype")
    op.execute("DROP TYPE IF EXISTS constructiontype")
    op.execute("DROP TYPE IF EXISTS constructionstatus")
