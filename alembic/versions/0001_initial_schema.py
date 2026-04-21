"""Initial schema for ДокПоток IRIS.

Revision ID: 0001
Revises:
Create Date: 2026-04-09 00:00:00.000000

Consolidates 000_initial, 001_add_planning, 002_add_users, and 003_new_modules.sql
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create initial schema."""

    # Create UUID extension
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    # Users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('login', sa.Text(), nullable=False),
        sa.Column('full_name', sa.Text(), nullable=False),
        sa.Column('role', sa.Text(), nullable=False, server_default='engineer'),
        sa.Column('discipline', sa.Text(), nullable=True),
        sa.Column('rank', sa.Text(), nullable=False, server_default='junior'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('username', sa.Text(), nullable=True),
        sa.Column('email', sa.Text(), nullable=True),
        sa.Column('password_hash', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('login'),
        sa.UniqueConstraint('username'),
        sa.UniqueConstraint('email'),
    )
    op.create_index('idx_users_username', 'users', ['username'])
    op.create_index('idx_users_email', 'users', ['email'])
    op.create_index('idx_users_role', 'users', ['role'])

    # Projects table
    op.create_table(
        'projects',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('code', sa.Text(), nullable=False),
        sa.Column('name', sa.Text(), nullable=False),
        sa.Column('customer', sa.Text(), nullable=True),
        sa.Column('status', sa.Text(), nullable=False, server_default='active'),
        sa.Column('manager_id', sa.Integer(), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('end_date_planned', sa.Date(), nullable=True),
        sa.Column('end_date_forecast', sa.Date(), nullable=True),
        sa.Column('end_date_actual', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('custom_fields', sa.JSON(), nullable=True),
        sa.Column('vdr_required', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('otk_required', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('crs_deadline_days', sa.Integer(), nullable=False, server_default='3'),
        sa.Column('logistics_delivery_weeks', sa.Integer(), nullable=False, server_default='2'),
        sa.Column('logistics_complexity', sa.Text(), nullable=False, server_default='normal'),
        sa.ForeignKeyConstraint(['manager_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code'),
    )
    op.create_index('idx_projects_status', 'projects', ['status'])

    # Documents table
    op.create_table(
        'documents',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('code', sa.Text(), nullable=False),
        sa.Column('title', sa.Text(), nullable=False),
        sa.Column('discipline', sa.Text(), nullable=True),
        sa.Column('status', sa.Text(), nullable=False, server_default='in_work'),
        sa.Column('current_revision_id', sa.Integer(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('uq_documents_project_code', 'documents', ['project_id', 'code'], unique=True)

    # Document revisions table
    op.create_table(
        'document_revisions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('document_id', sa.Integer(), nullable=False),
        sa.Column('revision_index', sa.Text(), nullable=False),
        sa.Column('revision_letter', sa.Text(), nullable=False),
        sa.Column('revision_number', sa.Integer(), nullable=False),
        sa.Column('version_number', sa.Integer(), nullable=False),
        sa.Column('status', sa.Text(), nullable=False),
        sa.Column('file_path', sa.Text(), nullable=False),
        sa.Column('change_log', sa.Text(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('approved_by', sa.Integer(), nullable=True),
        sa.Column('approved_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['approved_by'], ['users.id']),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('uq_document_revision_version', 'document_revisions', ['document_id', 'version_number'], unique=True)
    op.create_index('uq_document_revision_idx', 'document_revisions', ['document_id', 'revision_letter', 'revision_number'], unique=True)
    op.create_index('idx_document_revisions_document', 'document_revisions', ['document_id'])

    # Add foreign key for current_revision_id
    op.create_foreign_key('fk_documents_current_revision', 'documents', 'document_revisions', ['current_revision_id'], ['id'])

    # Planned tasks table
    op.create_table(
        'planned_tasks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('project_code', sa.Text(), nullable=False),
        sa.Column('project_name', sa.Text(), nullable=False),
        sa.Column('document_id', sa.Integer(), nullable=True),
        sa.Column('document_code', sa.Text(), nullable=True),
        sa.Column('revision_id', sa.Integer(), nullable=True),
        sa.Column('revision_index', sa.Text(), nullable=True),
        sa.Column('name', sa.Text(), nullable=False),
        sa.Column('task_type', sa.Text(), nullable=False, server_default='engineering'),
        sa.Column('assigned_to', sa.Integer(), nullable=True),
        sa.Column('owner_name', sa.Text(), nullable=True),
        sa.Column('duration_days_planned', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('work_hours_planned', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.Column('start_date_planned', sa.Date(), nullable=True),
        sa.Column('end_date_planned', sa.Date(), nullable=True),
        sa.Column('start_date_actual', sa.Date(), nullable=True),
        sa.Column('end_date_actual', sa.Date(), nullable=True),
        sa.Column('percent_complete', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('status', sa.Text(), nullable=False, server_default='not_started'),
        sa.Column('es', sa.Integer(), nullable=True),
        sa.Column('ef', sa.Integer(), nullable=True),
        sa.Column('ls', sa.Integer(), nullable=True),
        sa.Column('lf', sa.Integer(), nullable=True),
        sa.Column('slack', sa.Integer(), nullable=True),
        sa.Column('actual_hours', sa.Numeric(10, 2), nullable=True),
        sa.ForeignKeyConstraint(['assigned_to'], ['users.id']),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['revision_id'], ['document_revisions.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_planned_tasks_project', 'planned_tasks', ['project_id'])
    op.create_index('idx_planned_tasks_assigned_to', 'planned_tasks', ['assigned_to'])

    # Task dependencies table
    op.create_table(
        'task_dependencies',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('predecessor_task_id', sa.Integer(), nullable=False),
        sa.Column('successor_task_id', sa.Integer(), nullable=False),
        sa.Column('dependency_type', sa.Text(), nullable=False, server_default='FS'),
        sa.Column('lag_days', sa.Integer(), nullable=False, server_default='0'),
        sa.ForeignKeyConstraint(['predecessor_task_id'], ['planned_tasks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['successor_task_id'], ['planned_tasks.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_task_dependencies_project', 'task_dependencies', ['project_id'])
    op.create_index('idx_task_dependencies_successor', 'task_dependencies', ['successor_task_id'])

    # Time logs table
    op.create_table(
        'time_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('document_id', sa.Integer(), nullable=True),
        sa.Column('task_id', sa.Integer(), nullable=True),
        sa.Column('day', sa.Date(), nullable=False),
        sa.Column('hours', sa.Numeric(6, 2), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['task_id'], ['planned_tasks.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_time_logs_project_day', 'time_logs', ['project_id', 'day'])
    op.create_index('idx_time_logs_user_day', 'time_logs', ['user_id', 'day'])

    # Engineer metrics table
    op.create_table(
        'engineer_metrics',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('total_points', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('xp', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('rank', sa.Text(), nullable=False, server_default='junior'),
        sa.Column('tasks_completed', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('documents_closed', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id'),
    )

    # Gamification events table
    op.create_table(
        'gamification_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=True),
        sa.Column('event_type', sa.Text(), nullable=False),
        sa.Column('points_delta', sa.Integer(), nullable=False),
        sa.Column('xp_delta', sa.Integer(), nullable=False),
        sa.Column('metadata', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('action_key', sa.Text(), nullable=True),
        sa.Column('ref_doc_id', sa.Integer(), nullable=True),
        sa.Column('ref_task_id', sa.Integer(), nullable=True),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['ref_doc_id'], ['documents.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['ref_task_id'], ['planned_tasks.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_gamification_events_user', 'gamification_events', ['user_id'])

    # Gamification badges table
    op.create_table(
        'gamification_badges',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('badge_id', sa.Text(), nullable=False),
        sa.Column('name', sa.Text(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('awarded_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('metadata', sa.JSON(), nullable=False, server_default='{}'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'badge_id'),
    )
    op.create_index('idx_gamification_badges_user', 'gamification_badges', ['user_id'])

    # Notifications table
    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('type', sa.Text(), nullable=False),
        sa.Column('title', sa.Text(), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('metadata', sa.JSON(), nullable=False, server_default='{}'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_notifications_user', 'notifications', ['user_id'])
    op.create_index('idx_notifications_unread', 'notifications', ['user_id', 'is_read'])

    # Daily quests table
    op.create_table(
        'daily_quests',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('quest_type', sa.Text(), nullable=False),
        sa.Column('title', sa.Text(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('target_count', sa.Integer(), nullable=False),
        sa.Column('current_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('reward_points', sa.Integer(), nullable=False),
        sa.Column('reward_xp', sa.Integer(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('is_completed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_daily_quests_user_date', 'daily_quests', ['user_id', 'date'])
    op.create_index('idx_daily_quests_type', 'daily_quests', ['quest_type'])

    # Combo achievements table
    op.create_table(
        'combo_achievements',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('combo_type', sa.Text(), nullable=False),
        sa.Column('current_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('max_count', sa.Integer(), nullable=False, server_default='10'),
        sa.Column('multiplier', sa.Numeric(4, 2), nullable=False, server_default='1.0'),
        sa.Column('expires_at', sa.Date(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_combo_achievements_user_active', 'combo_achievements', ['user_id', 'is_active'])

    # Work schedules table
    op.create_table(
        'work_schedules',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.Text(), nullable=False),
        sa.Column('work_days', sa.JSON(), nullable=False, server_default='[0,1,2,3,4]'),
        sa.Column('start_time_hours', sa.Numeric(4, 2), nullable=False, server_default='8.5'),
        sa.Column('end_time_hours', sa.Numeric(4, 2), nullable=False, server_default='17.5'),
        sa.Column('lunch_duration_hours', sa.Numeric(4, 2), nullable=False, server_default='1.0'),
        sa.Column('is_default', sa.Boolean(), nullable=False, server_default='false'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
    )
    
    # Insert default 5-day schedule (8:30-17:30 with 1-hour lunch)
    op.execute(
        "INSERT INTO work_schedules (name, work_days, start_time_hours, end_time_hours, lunch_duration_hours, is_default) "
        "VALUES ('Стандартный график (Пн-Пт 8:30-17:30)', '[0,1,2,3,4]', 8.5, 17.5, 1.0, true)"
    )

    # Uploaded files table
    op.create_table(
        'uploaded_files',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('file_id', sa.UUID(), nullable=False),
        sa.Column('original_name', sa.Text(), nullable=False),
        sa.Column('stored_path', sa.Text(), nullable=False),
        sa.Column('size_bytes', sa.BigInteger(), nullable=False),
        sa.Column('mime_type', sa.Text(), nullable=False),
        sa.Column('uploaded_by', sa.Integer(), nullable=True),
        sa.Column('uploaded_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['uploaded_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('file_id'),
    )
    op.create_index('idx_uploaded_files_file_id', 'uploaded_files', ['file_id'])

    # Add columns to document_revisions for file storage integration
    op.add_column('document_revisions', sa.Column('uploaded_file_id', sa.Integer(), nullable=True))
    op.add_column('document_revisions', sa.Column('validation_profile', sa.Text(), nullable=True, server_default='ESKD'))
    op.add_column('document_revisions', sa.Column('validation_passed', sa.Boolean(), nullable=True))
    op.add_column('document_revisions', sa.Column('validation_errors', sa.JSON(), nullable=True, server_default='[]'))
    op.create_foreign_key('fk_document_revisions_uploaded_file', 'document_revisions', 'uploaded_files', ['uploaded_file_id'], ['id'])

    # Remarks table
    op.create_table(
        'remarks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('document_id', sa.Integer(), nullable=True),
        sa.Column('revision_id', sa.Integer(), nullable=True),
        sa.Column('author_id', sa.Integer(), nullable=True),
        sa.Column('assignee_id', sa.Integer(), nullable=True),
        sa.Column('source', sa.Text(), nullable=False, server_default='internal'),
        sa.Column('text', sa.Text(), nullable=False),
        sa.Column('status', sa.Text(), nullable=False, server_default='open'),
        sa.Column('resolution_comment', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['assignee_id'], ['users.id']),
        sa.ForeignKeyConstraint(['author_id'], ['users.id']),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['revision_id'], ['document_revisions.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_remarks_project', 'remarks', ['project_id'])
    op.create_index('idx_remarks_status', 'remarks', ['project_id', 'status'])

    # Remark responses table
    op.create_table(
        'remark_responses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('remark_id', sa.Integer(), nullable=False),
        sa.Column('author_id', sa.Integer(), nullable=False),
        sa.Column('text', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['author_id'], ['users.id']),
        sa.ForeignKeyConstraint(['remark_id'], ['remarks.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_remark_responses_remark', 'remark_responses', ['remark_id'])

    # VDR entries table
    op.create_table(
        'vdr_entries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('doc_number', sa.Text(), nullable=False),
        sa.Column('title', sa.Text(), nullable=False),
        sa.Column('discipline', sa.Text(), nullable=True),
        sa.Column('responsible_contractor', sa.Text(), nullable=True),
        sa.Column('latest_revision', sa.Text(), nullable=True),
        sa.Column('latest_upload_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', sa.Text(), nullable=True),
        sa.Column('is_auto_filled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('uq_vdr_project_docnum', 'vdr_entries', ['project_id', 'doc_number'], unique=True)

    # MDR entries table
    op.create_table(
        'mdr_entries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('doc_number', sa.Text(), nullable=False),
        sa.Column('title', sa.Text(), nullable=False),
        sa.Column('discipline', sa.Text(), nullable=True),
        sa.Column('revision_current', sa.Text(), nullable=True),
        sa.Column('planned_issue_date', sa.Date(), nullable=True),
        sa.Column('actual_issue_date', sa.Date(), nullable=True),
        sa.Column('status', sa.Text(), nullable=True),
        sa.Column('is_auto_filled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('uq_mdr_project_docnum', 'mdr_entries', ['project_id', 'doc_number'], unique=True)

    # Seed test data
    op.execute("""
        INSERT INTO users (login, full_name, role, rank) VALUES
        ('ivan.petrov', 'Иван Петров', 'engineer', 'senior'),
        ('maria.kuznetsova', 'Мария Кузнецова', 'manager', 'lead'),
        ('oleg.smirnov', 'Олег Смирнов', 'engineer', 'middle')
        ON CONFLICT (login) DO NOTHING
    """)

    # Seed admin user
    op.execute("""
            INSERT INTO users (username, login, email, password_hash, full_name, role)
            VALUES (
                'admin',
                'admin',
                'admin@stdo.local',
                '$2b$12$LJ3m4ys3Lk0TSwHjWz8wOeFlQSPaGZ5PZFV8MDB97vM5IjMEIJWe',
                'Администратор',
                'admin'
            ) ON CONFLICT (username) DO NOTHING
        """)


def downgrade() -> None:
    """Drop all tables created in upgrade."""

    # Drop tables in reverse order of dependencies
    op.drop_table('mdr_entries')
    op.drop_table('vdr_entries')
    op.drop_table('remark_responses')
    op.drop_table('remarks')
    op.drop_table('uploaded_files')
    op.drop_table('gamification_badges')
    op.drop_table('gamification_events')
    op.drop_table('notifications')
    op.drop_table('engineer_metrics')
    op.drop_table('time_logs')
    op.drop_table('task_dependencies')
    op.drop_table('planned_tasks')
    op.drop_table('document_revisions')
    op.drop_table('documents')
    op.drop_table('projects')
    op.drop_table('users')
