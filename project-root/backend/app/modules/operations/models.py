"""Operation models for production control."""
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Text, ForeignKey, DateTime, Integer, Float, Enum as SQLEnum, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.core.enums import OperationStatus


class Operation(Base):
    """Operation within a technological route."""
    __tablename__ = "operations"

    id: Mapped[int] = mapped_column(primary_key=True)
    route_id: Mapped[int] = mapped_column(ForeignKey("routes.id"), index=True)
    sequence: Mapped[int] = mapped_column(Integer)
    code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    name: Mapped[str] = mapped_column(String(255))
    work_center_id: Mapped[Optional[int]] = mapped_column(ForeignKey("work_centers.id"), nullable=True)
    responsible_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    status: Mapped[str] = mapped_column(SQLEnum(OperationStatus), default=OperationStatus.NOT_STARTED)
    
    # Scheduling
    planned_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    planned_finish: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    actual_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    actual_finish: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Progress
    estimated_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    actual_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    percent_complete: Mapped[int] = mapped_column(Integer, default=0)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    route: Mapped["Route"] = relationship(back_populates="operations")
    work_center: Mapped[Optional["WorkCenter"]] = relationship()
    responsible: Mapped[Optional["User"]] = relationship()
    tasks: Mapped[list["Task"]] = relationship(back_populates="operation")
    documents: Mapped[list["Document"]] = relationship(back_populates="operation")
    assignments: Mapped[list["OperationAssignment"]] = relationship(back_populates="operation")


class OperationAssignment(Base):
    """Assignment of user to operation."""
    __tablename__ = "operation_assignments"

    id: Mapped[int] = mapped_column(primary_key=True)
    operation_id: Mapped[int] = mapped_column(ForeignKey("operations.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    role: Mapped[str] = mapped_column(String(50))  # author, checker, approver, etc.
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    assigned_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"))

    # Relationships
    operation: Mapped["Operation"] = relationship(back_populates="assignments")
    user: Mapped["User"] = relationship()
    assigned_by: Mapped["User"] = relationship(foreign_keys=[assigned_by_id])


class WorkCenter(Base):
    """Work center / production area."""
    __tablename__ = "work_centers"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    type: Mapped[str] = mapped_column(String(50))  # design, drafting, approval, otk, storage
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    manager_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    manager: Mapped[Optional["User"]] = relationship()
    operations: Mapped[list["Operation"]] = relationship(back_populates="work_center")
