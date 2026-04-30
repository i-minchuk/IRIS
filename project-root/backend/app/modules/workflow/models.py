"""Workflow models for document approval routing."""
from typing import Optional, List
from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
    JSON,
    Enum as SQLEnum,
    Table,
    select,
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB
import enum

from app.db.base import Base


class WorkflowStatus(str, enum.Enum):
    """Status of a workflow instance."""
    DRAFT = 'draft'
    RUNNING = 'running'
    COMPLETED = 'completed'
    PAUSED = 'paused'
    CANCELLED = 'cancelled'
    FAILED = 'failed'


class WorkflowStepStatus(str, enum.Enum):
    """Status of a workflow step."""
    PENDING = 'pending'
    IN_PROGRESS = 'in_progress'
    APPROVED = 'approved'
    REJECTED = 'rejected'
    DELEGATED = 'delegated'
    SKIPPED = 'skipped'


class ApprovalType(str, enum.Enum):
    """Type of approval required."""
    VIEW_ONLY = 'view_only'  # Просто просмотр
    APPROVE = 'approve'  # Требуется подпись
    APPROVE_WITH_COMMENTS = 'approve_with_comments'  # Согласование с замечаниями


class AssignmentType(str, enum.Enum):
    """Type of step assignment."""
    SEQUENTIAL = 'sequential'  # Последовательное
    PARALLEL = 'parallel'  # Параллельное (все должны согласовать)
    ANY_OF = 'any_of'  # Достаточно одного из группы


# Association table для many-to-many между workflow_steps и users
workflow_step_assignees = Table(
    'workflow_step_assignees',
    Base.metadata,
    Column('step_id', Integer, ForeignKey('workflow_steps.id', ondelete='CASCADE'), primary_key=True),
    Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
)


class WorkflowTemplate(Base):
    """Шаблоны маршрутов согласования."""
    __tablename__ = 'workflow_templates'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)  # standard, fast, tender, custom
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # JSONB схема этапов маршрута
    # [
    #   {
    #     "id": "step_1",
    #     "name": "Проектировщик",
    #     "role": "designer",
    #     "user_ids": [1, 2, 3],
    #     "assignment_type": "any_of",
    #     "approval_type": "approve",
    #     "deadline_hours": 48,
    #     "auto_transition": {
    #       "on_approve": "next",
    #       "on_reject": "author"
    #     }
    #   }
    # ]
    steps_schema: Mapped[dict] = mapped_column(JSONB, nullable=False, default=list)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    created_by: Mapped[Optional[int]] = mapped_column(ForeignKey('users.id'), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    created_by_user = relationship('User', foreign_keys=[created_by], backref='created_templates')
    instances = relationship('WorkflowInstance', back_populates='template', lazy='dynamic')


class WorkflowInstance(Base):
    """Запущенные согласования (инстансы шаблонов)."""
    __tablename__ = 'workflow_instances'

    id: Mapped[int] = mapped_column(primary_key=True)
    template_id: Mapped[int] = mapped_column(ForeignKey('workflow_templates.id'), nullable=False)
    
    # Привязка к документу
    document_id: Mapped[Optional[int]] = mapped_column(ForeignKey('documents.id'), nullable=True)
    document_revision: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    document_name: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Привязка к проекту (опционально)
    project_id: Mapped[Optional[int]] = mapped_column(ForeignKey('projects.id'), nullable=True)
    
    status: Mapped[WorkflowStatus] = mapped_column(SQLEnum(WorkflowStatus), default=WorkflowStatus.DRAFT, nullable=False)
    
    # Текущий активный шаг
    current_step_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Кто запустил
    started_by: Mapped[Optional[int]] = mapped_column(ForeignKey('users.id'), nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Завершение
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_by: Mapped[Optional[int]] = mapped_column(ForeignKey('users.id'), nullable=True)
    
    # Комментарии к запуску
    launch_comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Документ изменился во время согласования
    document_changed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    template = relationship('WorkflowTemplate', back_populates='instances')
    started_by_user = relationship('User', foreign_keys=[started_by], backref='started_workflows')
    completed_by_user = relationship('User', foreign_keys=[completed_by], backref='completed_workflows')
    project = relationship('Project', backref='workflow_instances')
    steps = relationship('WorkflowStep', back_populates='instance', lazy='dynamic', order_by='WorkflowStep.order_index')


class WorkflowStep(Base):
    """Этапы согласования."""
    __tablename__ = 'workflow_steps'

    id: Mapped[int] = mapped_column(primary_key=True)
    instance_id: Mapped[int] = mapped_column(ForeignKey('workflow_instances.id', ondelete='CASCADE'), nullable=False)
    
    # Данные шага из шаблона
    step_key: Mapped[str] = mapped_column(String(100), nullable=False)  # уникальный ключ внутри инстанса
    step_name: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Назначение
    role: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # role-based assignment
    assignment_type: Mapped[AssignmentType] = mapped_column(
        SQLEnum(AssignmentType), default=AssignmentType.SEQUENTIAL, nullable=False
    )
    
    # Тип согласования
    approval_type: Mapped[ApprovalType] = mapped_column(
        SQLEnum(ApprovalType), default=ApprovalType.APPROVE, nullable=False
    )
    
    # Срок (в часах)
    deadline_hours: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Порядок выполнения
    order_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Статус
    status: Mapped[WorkflowStepStatus] = mapped_column(
        SQLEnum(WorkflowStepStatus), default=WorkflowStepStatus.PENDING, nullable=False
    )
    
    # Автоматические переходы
    auto_transition: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    # {"on_approve": "next", "on_reject": "author"}
    
    # Делегирование
    is_delegated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Timestamps
    assigned_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Кто выполнил (последний)
    completed_by: Mapped[Optional[int]] = mapped_column(ForeignKey('users.id'), nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Relationships
    instance = relationship('WorkflowInstance', back_populates='steps')
    completed_by_user = relationship('User', foreign_keys=[completed_by], backref='completed_steps')
    assignees = relationship(
        'User',
        secondary=workflow_step_assignees,
        backref='assigned_steps'
    )
    comments = relationship('WorkflowComment', back_populates='step', lazy='dynamic', order_by='WorkflowComment.created_at')
    audit_logs = relationship('WorkflowAuditLog', back_populates='step', lazy='dynamic')


class WorkflowComment(Base):
    """Комментарии согласующих с привязкой к документу."""
    __tablename__ = 'workflow_comments'

    id: Mapped[int] = mapped_column(primary_key=True)
    step_id: Mapped[int] = mapped_column(ForeignKey('workflow_steps.id', ondelete='CASCADE'), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False)
    
    # Текст комментария
    text: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Привязка к документу (координаты для PDF/чертежей)
    page_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    coordinates: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    # {"x": 100, "y": 200, "width": 50, "height": 30}
    
    # Ссылка на конкретную ревизию
    revision: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    step = relationship('WorkflowStep', back_populates='comments')
    user = relationship('User', backref='workflow_comments')


class WorkflowAuditLog(Base):
    """Полная история изменений workflow."""
    __tablename__ = 'workflow_audit_log'

    id: Mapped[int] = mapped_column(primary_key=True)
    step_id: Mapped[Optional[int]] = mapped_column(ForeignKey('workflow_steps.id'), nullable=True)
    instance_id: Mapped[int] = mapped_column(ForeignKey('workflow_instances.id'), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False)
    
    # Действие
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    # created, started, approved, rejected, delegated, paused, resumed, cancelled, skipped
    
    # Детали
    old_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    new_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Комментарий к действию
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Метаданные (JSON)
    audit_metadata: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    # {"previous_step_id": 1, "reason": "текст отказа", "delegated_to": 5}
    
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Relationships
    step = relationship('WorkflowStep', back_populates='audit_logs')
    instance = relationship('WorkflowInstance', backref='audit_logs')
    user = relationship('User', backref='workflow_audit_logs')
