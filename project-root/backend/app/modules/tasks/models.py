"""Task models for production control."""
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    String, Text, ForeignKey, DateTime, Integer, Float,
    Enum as SQLEnum, Boolean, Index, JSON
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.core.enums import TaskType, TaskStatus, TaskPriority


class Task(Base):
    """Task model for production control and project management."""
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    
    # Basic fields
    title: Mapped[str] = mapped_column(String(500))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Classification
    type: Mapped[str] = mapped_column(SQLEnum(TaskType), default=TaskType.PRODUCTION)
    status: Mapped[str] = mapped_column(SQLEnum(TaskStatus), default=TaskStatus.NEW)
    priority: Mapped[str] = mapped_column(SQLEnum(TaskPriority), default=TaskPriority.NORMAL)
    
    # Scheduling
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Assignments
    assignee_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    creator_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    
    # Production context - nullable FKs for flexible linking
    project_id: Mapped[Optional[int]] = mapped_column(ForeignKey("projects.id"), nullable=True, index=True)
    route_id: Mapped[Optional[int]] = mapped_column(ForeignKey("routes.id"), nullable=True, index=True)
    operation_id: Mapped[Optional[int]] = mapped_column(ForeignKey("operations.id"), nullable=True, index=True)
    document_id: Mapped[Optional[int]] = mapped_column(ForeignKey("documents.id"), nullable=True, index=True)
    
    # Work center / production area
    work_center_id: Mapped[Optional[int]] = mapped_column(ForeignKey("work_centers.id"), nullable=True)
    
    # Metadata
    estimated_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    actual_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    percent_complete: Mapped[int] = mapped_column(Integer, default=0)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )
    
    # Additional metadata as JSON (using task_data instead of reserved 'metadata')
    task_data: Mapped[Optional[dict]] = mapped_column(JSON, default=dict)
    
    # Indexes for performance
    __table_args__ = (
        Index("idx_tasks_project_status", "project_id", "status"),
        Index("idx_tasks_assignee_status", "assignee_id", "status"),
        Index("idx_tasks_due_date", "due_date", "status"),
        Index("idx_tasks_type_status", "type", "status"),
        Index("idx_tasks_priority", "priority"),
    )

    # Relationships
    creator: Mapped["User"] = relationship(foreign_keys=[creator_id])
    assignee: Mapped[Optional["User"]] = relationship(foreign_keys=[assignee_id])
    project: Mapped[Optional["Project"]] = relationship(back_populates="tasks")
    route: Mapped[Optional["Route"]] = relationship(back_populates="tasks")
    operation: Mapped[Optional["Operation"]] = relationship(back_populates="tasks")
    document: Mapped[Optional["Document"]] = relationship(back_populates="tasks")
    work_center: Mapped[Optional["WorkCenter"]] = relationship()
    
