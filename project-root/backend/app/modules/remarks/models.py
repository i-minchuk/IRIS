"""Remark models for issue tracking and control."""
from typing import Optional, List
from datetime import datetime
import uuid

from sqlalchemy import (
    Column,
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
    JSON,
    Enum as SQLEnum,
    Date,
    Integer,
    UUID as SQLUUID,
    Table,
    select,
    event,
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
from sqlalchemy.orm import relationship, Mapped, mapped_column
import enum

from app.db.base import Base


class RemarkSource(str, enum.Enum):
    """Source of the remark."""
    INTERNAL = 'internal'
    CUSTOMER = 'customer'
    REGULATORY = 'regulatory'
    WORKFLOW = 'workflow'
    AUDIT = 'audit'
    MANUAL = 'manual'


class RemarkStatus(str, enum.Enum):
    """Status of the remark."""
    NEW = 'new'
    IN_PROGRESS = 'in_progress'
    RESOLVED = 'resolved'
    REJECTED = 'rejected'
    DEFERRED = 'deferred'
    CLOSED = 'closed'


class RemarkPriority(str, enum.Enum):
    """Priority of the remark."""
    CRITICAL = 'critical'
    HIGH = 'high'
    MEDIUM = 'medium'
    LOW = 'low'


class RemarkCategory(str, enum.Enum):
    """Category of the remark."""
    DESIGN_ERROR = 'design_error'
    DISCREPANCY = 'discrepancy'
    INCOMPLETENESS = 'incompleteness'
    NORM_VIOLATION = 'norm_violation'
    CUSTOMER_REQUEST = 'customer_request'
    OTHER = 'other'


class Remark(Base):
    """Замечания по проектам и документации."""
    __tablename__ = 'remarks'

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    # Привязка к сущностям
    project_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey('projects.id', ondelete='CASCADE'),
        nullable=True
    )
    document_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey('documents.id', ondelete='CASCADE'),
        nullable=True
    )
    revision_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey('document_revisions.id', ondelete='CASCADE'),
        nullable=True
    )
    workflow_step_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey('workflow_steps.id', ondelete='SET NULL'),
        nullable=True
    )

    # Классификация
    source: Mapped[RemarkSource] = mapped_column(
        SQLEnum(RemarkSource),
        nullable=False,
        default=RemarkSource.MANUAL
    )
    status: Mapped[RemarkStatus] = mapped_column(
        SQLEnum(RemarkStatus),
        nullable=False,
        default=RemarkStatus.NEW
    )
    priority: Mapped[RemarkPriority] = mapped_column(
        SQLEnum(RemarkPriority),
        nullable=False,
        default=RemarkPriority.MEDIUM
    )
    category: Mapped[RemarkCategory] = mapped_column(
        SQLEnum(RemarkCategory),
        nullable=False,
        default=RemarkCategory.OTHER
    )

    # Контент
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    location_ref: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True
    )

    # Авторы и исполнители
    author_id: Mapped[int] = mapped_column(
        ForeignKey('users.id'),
        nullable=False
    )
    assignee_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey('users.id'),
        nullable=True
    )

    # Дедлайн и решение
    due_date: Mapped[Optional[datetime]] = mapped_column(Date, nullable=True)
    resolution: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resolved_by: Mapped[Optional[int]] = mapped_column(
        ForeignKey('users.id'),
        nullable=True
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    # Группировка
    parent_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey('remarks.id', ondelete='CASCADE'),
        nullable=True
    )
    related_remark_ids: Mapped[List[uuid.UUID]] = mapped_column(
        ARRAY(UUID(as_uuid=True)),
        default=list
    )

    # JSONB поля
    attachments: Mapped[List[dict]] = mapped_column(
        JSONB,
        default=list
    )
    history: Mapped[List[dict]] = mapped_column(
        JSONB,
        default=list
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # Relationships
    project = relationship('Project', backref='remarks')
    document = relationship('Document', backref='remarks')
    revision = relationship('DocumentRevision', backref='remarks')
    workflow_step = relationship('WorkflowStep', backref='remarks')
    author = relationship('User', foreign_keys=[author_id], backref='authored_remarks')
    assignee = relationship('User', foreign_keys=[assignee_id], backref='assigned_remarks')
    resolved_by_user = relationship('User', foreign_keys=[resolved_by], backref='resolved_remarks')
    parent = relationship('Remark', remote_side=[id], backref='children')
    comments = relationship('RemarkComment', back_populates='remark', lazy='dynamic', order_by='RemarkComment.created_at')
    tags = relationship('RemarkTag', secondary='remark_tag_links', backref='remarks')

    def __repr__(self):
        return f"<Remark(id={self.id}, title='{self.title}', status={self.status.value}, priority={self.priority.value})>"


class RemarkComment(Base):
    """Комментарии к замечаниям."""
    __tablename__ = 'remark_comments'

    id: Mapped[int] = mapped_column(primary_key=True)
    remark_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey('remarks.id', ondelete='CASCADE'),
        nullable=False
    )
    author_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    is_internal: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # Relationships
    remark = relationship('Remark', back_populates='comments')
    author = relationship('User', backref='remark_comments')

    def __repr__(self):
        return f"<RemarkComment(id={self.id}, remark_id={self.remark_id}, author_id={self.author_id})>"


class RemarkTag(Base):
    """Теги для замечаний."""
    __tablename__ = 'remark_tags'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    color: Mapped[str] = mapped_column(String(20), default='#CBD5E0')

    def __repr__(self):
        return f"<RemarkTag(id={self.id}, name='{self.name}', color={self.color})>"


# Association table для many-to-many между remarks и tags
remark_tag_links = Table(
    'remark_tag_links',
    Base.metadata,
    Column('remark_id', UUID(as_uuid=True), ForeignKey('remarks.id', ondelete='CASCADE'), primary_key=True),
    Column('tag_id', Integer, ForeignKey('remark_tags.id', ondelete='CASCADE'), primary_key=True)
)


# Автоматическое добавление записи в history при изменении статуса
@event.listens_for(Remark, 'before_update')
def receive_before_update(mapper, connection, target):
    if 'status' in connection.execution_options.get('modified_attrs', []):
        pass  # History будет добавляться на уровне сервиса
