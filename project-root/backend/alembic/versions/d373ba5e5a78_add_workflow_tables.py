"""add_workflow_tables

Revision ID: d373ba5e5a78
Revises: 20260501_090000
Create Date: 2026-04-29 17:01:09.699267

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd373ba5e5a78'
down_revision: Union[str, None] = '20260501_090000'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Workflow Templates
    op.create_table('workflow_templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('code', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('steps_schema', sa.JSON(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('is_default', sa.Boolean(), nullable=False, default=False),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code')
    )
    
    # Workflow Instances
    op.create_table('workflow_instances',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('template_id', sa.Integer(), nullable=False),
        sa.Column('document_id', sa.Integer(), nullable=True),
        sa.Column('document_revision', sa.Integer(), nullable=True),
        sa.Column('document_name', sa.String(length=500), nullable=True),
        sa.Column('project_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.Enum('DRAFT', 'RUNNING', 'COMPLETED', 'PAUSED', 'CANCELLED', 'FAILED', name='workflowstatus'), nullable=False),
        sa.Column('current_step_id', sa.Integer(), nullable=True),
        sa.Column('started_by', sa.Integer(), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_by', sa.Integer(), nullable=True),
        sa.Column('launch_comment', sa.Text(), nullable=True),
        sa.Column('document_changed', sa.Boolean(), nullable=False, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['template_id'], ['workflow_templates.id'], ),
        sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Workflow Steps
    op.create_table('workflow_steps',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('instance_id', sa.Integer(), nullable=False),
        sa.Column('step_key', sa.String(length=100), nullable=False),
        sa.Column('step_name', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=100), nullable=True),
        sa.Column('assignment_type', sa.Enum('SEQUENTIAL', 'PARALLEL', 'ANY_OF', name='assignmenttype'), nullable=False),
        sa.Column('approval_type', sa.Enum('VIEW_ONLY', 'APPROVE', 'APPROVE_WITH_COMMENTS', name='approvaltype'), nullable=False),
        sa.Column('deadline_hours', sa.Integer(), nullable=True),
        sa.Column('order_index', sa.Integer(), nullable=False),
        sa.Column('status', sa.Enum('PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'DELEGATED', 'SKIPPED', name='workflowstepstatus'), nullable=False),
        sa.Column('auto_transition', sa.JSON(), nullable=True),
        sa.Column('is_delegated', sa.Boolean(), nullable=False, default=False),
        sa.Column('assigned_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['instance_id'], ['workflow_instances.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['completed_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Workflow Step Assignees (many-to-many)
    op.create_table('workflow_step_assignees',
        sa.Column('step_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['step_id'], ['workflow_steps.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('step_id', 'user_id')
    )
    
    # Workflow Comments
    op.create_table('workflow_comments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('step_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('text', sa.Text(), nullable=False),
        sa.Column('page_number', sa.Integer(), nullable=True),
        sa.Column('coordinates', sa.JSON(), nullable=True),
        sa.Column('revision', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['step_id'], ['workflow_steps.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Workflow Audit Log
    op.create_table('workflow_audit_log',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('step_id', sa.Integer(), nullable=True),
        sa.Column('instance_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('old_status', sa.String(length=50), nullable=True),
        sa.Column('new_status', sa.String(length=50), nullable=True),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('audit_metadata', sa.JSON(), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['step_id'], ['workflow_steps.id'], ),
        sa.ForeignKeyConstraint(['instance_id'], ['workflow_instances.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index('ix_workflow_templates_code', 'workflow_templates', ['code'])
    op.create_index('ix_workflow_instances_status', 'workflow_instances', ['status'])
    op.create_index('ix_workflow_instances_document_id', 'workflow_instances', ['document_id'])
    op.create_index('ix_workflow_steps_instance_id', 'workflow_steps', ['instance_id'])
    op.create_index('ix_workflow_audit_log_instance_id', 'workflow_audit_log', ['instance_id'])


def downgrade() -> None:
    op.drop_index('ix_workflow_audit_log_instance_id', table_name='workflow_audit_log')
    op.drop_index('ix_workflow_steps_instance_id', table_name='workflow_steps')
    op.drop_index('ix_workflow_instances_document_id', table_name='workflow_instances')
    op.drop_index('ix_workflow_instances_status', table_name='workflow_instances')
    op.drop_index('ix_workflow_templates_code', table_name='workflow_templates')
    
    op.drop_table('workflow_audit_log')
    op.drop_table('workflow_comments')
    op.drop_table('workflow_step_assignees')
    op.drop_table('workflow_steps')
    op.drop_table('workflow_instances')
    op.drop_table('workflow_templates')
