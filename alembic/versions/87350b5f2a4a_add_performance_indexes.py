"""Add performance indexes from SQL migrations 002 and 004.

Migration Plan:
- Consolidates indexes from:
  - db/migrations/002_add_performance_indexes.sql
  - db/migrations/004_additional_performance_indexes.sql
- Source SQL files should be marked as MIGRATED after this is applied

Revision ID: 87350b5f2a4a
Revises: 0003
Create Date: 2026-04-12 20:20:56.338926

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '87350b5f2a4a'
down_revision: Union[str, Sequence[str], None] = '0003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - Add performance indexes."""
    
    # ============================================================================
    # FROM 002_add_performance_indexes.sql
    # ============================================================================
    
    # INDEXES FOR DOCUMENTS
    op.execute("CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_documents_code ON documents(code)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_documents_project_status ON documents(project_id, status)")
    
    # INDEXES FOR PLANNED_TASKS
    op.execute("CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON planned_tasks(project_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_tasks_status ON planned_tasks(status)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON planned_tasks(assigned_to)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_tasks_dates ON planned_tasks(start_date_planned, end_date_planned)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_tasks_project_status_deadline ON planned_tasks(project_id, status, end_date_planned)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_tasks_project_revision ON planned_tasks(project_id, revision_id)")
    
    # INDEXES FOR TASK_DEPENDENCIES
    op.execute("CREATE INDEX IF NOT EXISTS idx_deps_project_id ON task_dependencies(project_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_deps_predecessor ON task_dependencies(predecessor_task_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_deps_successor ON task_dependencies(successor_task_id)")
    
    # INDEXES FOR DOCUMENT_REVISIONS
    op.execute("CREATE INDEX IF NOT EXISTS idx_revisions_document_id ON document_revisions(document_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_revisions_status ON document_revisions(status)")
    
    # INDEXES FOR REMARKS
    op.execute("CREATE INDEX IF NOT EXISTS idx_remarks_project_id ON remarks(project_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_remarks_status ON remarks(status)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_remarks_assignee ON remarks(assignee_id)")
    
    # INDEXES FOR USERS
    op.execute("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
    
    # INDEXES FOR PROJECTS
    op.execute("CREATE INDEX IF NOT EXISTS idx_projects_status_manager ON projects(status, manager_id)")
    
    # ============================================================================
    # FROM 004_additional_performance_indexes.sql
    # ============================================================================
    
    # GAMIFICATION - Heavy aggregation queries
    op.execute("CREATE INDEX IF NOT EXISTS idx_gamification_events_user_points ON gamification_events (user_id) INCLUDE (points_delta)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_gamification_events_user_type ON gamification_events (user_id, event_type)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_gamification_events_created_at ON gamification_events (created_at DESC)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_gamification_events_user_date ON gamification_events (user_id, created_at DESC)")
    
    # NOTIFICATIONS - Frequent count queries
    op.execute("CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications (user_id, is_read) WHERE is_read = false")
    op.execute("CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications (user_id, created_at DESC)")
    
    # TIME LOGS - Reporting and workload
    op.execute("CREATE INDEX IF NOT EXISTS idx_time_logs_user_project_date ON time_logs (user_id, project_id, day DESC)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_time_logs_project_date_desc ON time_logs (project_id, day DESC)")
    
    # REMARKS - Project feedback
    op.execute("CREATE INDEX IF NOT EXISTS idx_remarks_project_status ON remarks (project_id, status)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_remarks_unresolved ON remarks (project_id, status) WHERE status != 'resolved'")
    
    # DOCUMENTS - Search and filtering
    op.execute("CREATE INDEX IF NOT EXISTS idx_documents_project_status_created ON documents (project_id, status, created_at DESC)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_documents_title_gin ON documents USING gin(to_tsvector('russian', title))")
    
    # TASKS - Workload and scheduling
    op.execute("CREATE INDEX IF NOT EXISTS idx_tasks_assignee_status_date ON planned_tasks (assigned_to, status, start_date_planned)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_tasks_overdue ON planned_tasks (status, end_date_planned) WHERE status NOT IN ('completed', 'cancelled')")
    
    # DAILY QUESTS - User progress tracking
    op.execute("CREATE INDEX IF NOT EXISTS idx_daily_quests_user_date ON daily_quests (user_id, date DESC)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_daily_quests_user_date_completed ON daily_quests (user_id, date, is_completed) WHERE is_completed = true")
    
    # BADGES & COMBO ACHIEVEMENTS
    op.execute("CREATE INDEX IF NOT EXISTS idx_badges_user_awarded ON gamification_badges (user_id, awarded_at DESC)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_combo_user_active ON combo_achievements (user_id, combo_type, expires_at, is_active)")
    
    # TENDERS - Status filtering
    op.execute("CREATE INDEX IF NOT EXISTS idx_tenders_status_created ON tenders (status, created_at DESC)")


def downgrade() -> None:
    """Downgrade schema - Drop all indexes."""
    
    # FROM 004_additional_performance_indexes.sql
    op.execute("DROP INDEX IF EXISTS idx_gamification_events_user_points")
    op.execute("DROP INDEX IF EXISTS idx_gamification_events_user_type")
    op.execute("DROP INDEX IF EXISTS idx_gamification_events_created_at")
    op.execute("DROP INDEX IF EXISTS idx_gamification_events_user_date")
    op.execute("DROP INDEX IF EXISTS idx_notifications_user_unread")
    op.execute("DROP INDEX IF EXISTS idx_notifications_user_created")
    op.execute("DROP INDEX IF EXISTS idx_time_logs_user_project_date")
    op.execute("DROP INDEX IF EXISTS idx_time_logs_project_date_desc")
    op.execute("DROP INDEX IF EXISTS idx_remarks_project_status")
    op.execute("DROP INDEX IF EXISTS idx_remarks_unresolved")
    op.execute("DROP INDEX IF EXISTS idx_documents_project_status_created")
    op.execute("DROP INDEX IF EXISTS idx_documents_title_gin")
    op.execute("DROP INDEX IF EXISTS idx_tasks_assignee_status_date")
    op.execute("DROP INDEX IF EXISTS idx_tasks_overdue")
    op.execute("DROP INDEX IF EXISTS idx_daily_quests_user_date")
    op.execute("DROP INDEX IF EXISTS idx_daily_quests_user_date_completed")
    op.execute("DROP INDEX IF EXISTS idx_badges_user_awarded")
    op.execute("DROP INDEX IF EXISTS idx_combo_user_active")
    op.execute("DROP INDEX IF EXISTS idx_tenders_status_created")
    
    # FROM 002_add_performance_indexes.sql
    op.execute("DROP INDEX IF EXISTS idx_documents_project_id")
    op.execute("DROP INDEX IF EXISTS idx_documents_status")
    op.execute("DROP INDEX IF EXISTS idx_documents_code")
    op.execute("DROP INDEX IF EXISTS idx_documents_created_at")
    op.execute("DROP INDEX IF EXISTS idx_documents_project_status")
    op.execute("DROP INDEX IF EXISTS idx_tasks_project_id")
    op.execute("DROP INDEX IF EXISTS idx_tasks_status")
    op.execute("DROP INDEX IF EXISTS idx_tasks_assigned_to")
    op.execute("DROP INDEX IF EXISTS idx_tasks_dates")
    op.execute("DROP INDEX IF EXISTS idx_tasks_project_status_deadline")
    op.execute("DROP INDEX IF EXISTS idx_tasks_project_revision")
    op.execute("DROP INDEX IF EXISTS idx_deps_project_id")
    op.execute("DROP INDEX IF EXISTS idx_deps_predecessor")
    op.execute("DROP INDEX IF EXISTS idx_deps_successor")
    op.execute("DROP INDEX IF EXISTS idx_revisions_document_id")
    op.execute("DROP INDEX IF EXISTS idx_revisions_status")
    op.execute("DROP INDEX IF EXISTS idx_remarks_project_id")
    op.execute("DROP INDEX IF EXISTS idx_remarks_status")
    op.execute("DROP INDEX IF EXISTS idx_remarks_assignee")
    op.execute("DROP INDEX IF EXISTS idx_users_username")
    op.execute("DROP INDEX IF EXISTS idx_users_email")
    op.execute("DROP INDEX IF EXISTS idx_projects_status_manager")
