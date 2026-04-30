"""add tasks and production tables

Revision ID: 20260501_090000
Revises: 544e3601aad5
Create Date: 2026-05-01 09:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '20260501_090000'
down_revision: Union[str, None] = '544e3601aad5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create ENUM types
    op.execute("CREATE TYPE IF NOT EXISTS task_type AS ENUM ('production', 'document', 'approval', 'review', 'issue', 'planning', 'meeting', 'other')")
    op.execute("CREATE TYPE IF NOT EXISTS task_status AS ENUM ('new', 'in_progress', 'on_hold', 'done', 'cancelled', 'review', 'approval')")
    op.execute("CREATE TYPE IF NOT EXISTS task_priority AS ENUM ('low', 'normal', 'high', 'critical')")
    op.execute("CREATE TYPE IF NOT EXISTS operation_status AS ENUM ('not_started', 'in_progress', 'completed', 'blocked', 'cancelled')")
    op.execute("CREATE TYPE IF NOT EXISTS work_center_type AS ENUM ('design', 'drafting', 'approval', 'otk', 'storage')")
    
    # Work Centers - production areas
    op.create_table('work_centers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('type', sa.Enum('design', 'drafting', 'approval', 'otk', 'storage', name='work_center_type'), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('manager_id', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['manager_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_work_centers_code'), 'work_centers', ['code'], unique=True)
    
    # Routes - technological routes for projects
    op.create_table('routes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('version', sa.String(length=20), nullable=False),
        sa.Column('is_template', sa.Boolean(), default=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_by_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_routes_project_id'), 'routes', ['project_id'], unique=False)
    
    # Operations - operations within routes
    op.create_table('operations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('route_id', sa.Integer(), nullable=False),
        sa.Column('sequence', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('work_center_id', sa.Integer(), nullable=True),
        sa.Column('responsible_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.Enum('not_started', 'in_progress', 'completed', 'blocked', 'cancelled', name='operation_status'), nullable=False, default='not_started'),
        sa.Column('planned_start', sa.DateTime(timezone=True), nullable=True),
        sa.Column('planned_finish', sa.DateTime(timezone=True), nullable=True),
        sa.Column('actual_start', sa.DateTime(timezone=True), nullable=True),
        sa.Column('actual_finish', sa.DateTime(timezone=True), nullable=True),
        sa.Column('estimated_hours', sa.Float(), nullable=True),
        sa.Column('actual_hours', sa.Float(), nullable=True),
        sa.Column('percent_complete', sa.Integer(), default=0),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['route_id'], ['routes.id'], ),
        sa.ForeignKeyConstraint(['work_center_id'], ['work_centers.id'], ),
        sa.ForeignKeyConstraint(['responsible_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_operations_route_id'), 'operations', ['route_id'], unique=False)
    op.create_index('idx_operations_status', 'operations', ['status'])
    
    # Operation Assignments - who is working on what
    op.create_table('operation_assignments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('operation_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False),  # author, checker, approver, etc.
        sa.Column('assigned_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('assigned_by_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['operation_id'], ['operations.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['assigned_by_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_operation_assignments_operation_id'), 'operation_assignments', ['operation_id'], unique=False)
    op.create_index(op.f('ix_operation_assignments_user_id'), 'operation_assignments', ['user_id'], unique=False)
    
    # TASKS - main task table
    op.create_table('tasks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('type', sa.Enum('production', 'document', 'approval', 'review', 'issue', 'planning', 'meeting', 'other', name='task_type'), nullable=False, default='production'),
        sa.Column('status', sa.Enum('new', 'in_progress', 'on_hold', 'done', 'cancelled', 'review', 'approval', name='task_status'), nullable=False, default='new'),
        sa.Column('priority', sa.Enum('low', 'normal', 'high', 'critical', name='task_priority'), nullable=False, default='normal'),
        sa.Column('due_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('assignee_id', sa.Integer(), nullable=True),
        sa.Column('creator_id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=True),
        sa.Column('route_id', sa.Integer(), nullable=True),
        sa.Column('operation_id', sa.Integer(), nullable=True),
        sa.Column('document_id', sa.Integer(), nullable=True),
        sa.Column('work_center_id', sa.Integer(), nullable=True),
        sa.Column('estimated_hours', sa.Float(), nullable=True),
        sa.Column('actual_hours', sa.Float(), nullable=True),
        sa.Column('percent_complete', sa.Integer(), default=0),
        sa.Column('task_data', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['assignee_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['creator_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ),
        sa.ForeignKeyConstraint(['operation_id'], ['operations.id'], ),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ),
        sa.ForeignKeyConstraint(['route_id'], ['routes.id'], ),
        sa.ForeignKeyConstraint(['work_center_id'], ['work_centers.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Task indexes
    op.create_index(op.f('ix_tasks_id'), 'tasks', ['id'], unique=False)
    op.create_index('idx_tasks_project_status', 'tasks', ['project_id', 'status'])
    op.create_index('idx_tasks_assignee_status', 'tasks', ['assignee_id', 'status'])
    op.create_index('idx_tasks_due_date', 'tasks', ['due_date', 'status'])
    op.create_index('idx_tasks_type_status', 'tasks', ['type', 'status'])
    op.create_index('idx_tasks_priority', 'tasks', ['priority'])
    
    # Update documents table to link with operations and tasks
    with op.batch_alter_table('documents') as batch_op:
        batch_op.add_column(sa.Column('operation_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('planned_ready', sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column('actual_ready', sa.DateTime(timezone=True), nullable=True))
        batch_op.create_foreign_key('fk_documents_operation', 'operations', ['operation_id'], ['id'])
        batch_op.create_index('idx_documents_operation', 'documents', ['operation_id'])
    
    # Update projects table for task-related fields
    with op.batch_alter_table('projects') as batch_op:
        batch_op.add_column(sa.Column('planned_finish', sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column('forecast_finish', sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column('manager_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_projects_manager', 'users', ['manager_id'], ['id'])
    
    # Add relationship back to projects
    with op.batch_alter_table('projects') as batch_op:
        # This will be added via relationship in ORM, not FK
        pass
    
    # Seed default work centers
    op.execute("""
        INSERT INTO work_centers (code, name, type, description, created_at, updated_at)
        VALUES 
            ('DESIGN-01', 'Отдел конструирования', 'design', 'Основной конструкторский отдел', NOW(), NOW()),
            ('DRAFT-01', 'Отдел графики', 'drafting', 'Отдел графической документации', NOW(), NOW()),
            ('APPROVAL-01', 'Отдел согласования', 'approval', 'Отдел согласования и утверждения', NOW(), NOW()),
            ('OTK-01', 'ОТК', 'otk', 'Отдел технического контроля', NOW(), NOW())
        ON CONFLICT (code) DO NOTHING
    """)


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('tasks')
    op.drop_table('operation_assignments')
    op.drop_table('operations')
    op.drop_table('routes')
    op.drop_table('work_centers')
    
    # Drop ENUM types
    op.execute("DROP TYPE IF EXISTS task_type")
    op.execute("DROP TYPE IF EXISTS task_status")
    op.execute("DROP TYPE IF EXISTS task_priority")
    op.execute("DROP TYPE IF EXISTS operation_status")
    op.execute("DROP TYPE IF EXISTS work_center_type")
