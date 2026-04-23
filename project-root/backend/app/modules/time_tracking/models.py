"""Time tracking and session models."""
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Text, ForeignKey, DateTime, Integer, Float, JSON, Boolean, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class TimeSession(Base):
    __tablename__ = "time_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    document_id: Mapped[Optional[int]] = mapped_column(ForeignKey("documents.id"), nullable=True, index=True)
    project_id: Mapped[Optional[int]] = mapped_column(ForeignKey("projects.id"), nullable=True, index=True)

    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    total_duration: Mapped[int] = mapped_column(default=0)
    active_time: Mapped[int] = mapped_column(default=0)
    idle_time: Mapped[int] = mapped_column(default=0)
    breaks: Mapped[Optional[list]] = mapped_column(JSON, default=list)

    edit_count: Mapped[int] = mapped_column(default=0)
    blocks_modified: Mapped[Optional[list]] = mapped_column(JSON, default=list)
    variables_changed: Mapped[Optional[list]] = mapped_column(JSON, default=list)
    revisions_created: Mapped[int] = mapped_column(default=0)
    remarks_resolved: Mapped[int] = mapped_column(default=0)
    remarks_created: Mapped[int] = mapped_column(default=0)
    approvals_given: Mapped[int] = mapped_column(default=0)

    efficiency_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    complexity_index: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    normalized_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    __table_args__ = (
        Index("ix_timesession_user_started", "user_id", "started_at"),
        Index("ix_timesession_project_started", "project_id", "started_at"),
        Index("ix_timesession_user_project", "user_id", "project_id"),
    )


class EmployeeLoad(Base):
    __tablename__ = "employee_loads"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    planned_hours: Mapped[float] = mapped_column(default=0)
    actual_hours: Mapped[float] = mapped_column(default=0)
    available_hours: Mapped[float] = mapped_column(default=168)  # 40h week default
    load_percentage: Mapped[float] = mapped_column(default=0)
    project_id: Mapped[Optional[int]] = mapped_column(ForeignKey("projects.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
