"""Project hierarchy models for ДокПоток IRIS."""
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Text, ForeignKey, DateTime, Integer, Float, JSON, Enum, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    customer_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    contract_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    contract_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    stage: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # Эскизный, Технический, Рабочий
    status: Mapped[str] = mapped_column(String(50), default="draft")  # draft, active, completed, archived
    standard_template_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    variables: Mapped[Optional[dict]] = mapped_column(JSON, default=dict)
    
    # Task-related fields
    planned_finish: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    forecast_finish: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    manager_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    
    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    stages: Mapped[list["Stage"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    documents: Mapped[list["Document"]] = relationship(back_populates="project")
    routes: Mapped[list["Route"]] = relationship(back_populates="project")
    tasks: Mapped[list["Task"]] = relationship(back_populates="project")
    manager: Mapped[Optional["User"]] = relationship(foreign_keys=[manager_id])


class Stage(Base):
    __tablename__ = "stages"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    name: Mapped[str] = mapped_column(String(100))
    code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    sort_order: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    project: Mapped["Project"] = relationship(back_populates="stages")
    kits: Mapped[list["Kit"]] = relationship(back_populates="stage", cascade="all, delete-orphan")


class Kit(Base):
    __tablename__ = "kits"

    id: Mapped[int] = mapped_column(primary_key=True)
    stage_id: Mapped[int] = mapped_column(ForeignKey("stages.id"))
    name: Mapped[str] = mapped_column(String(100))
    code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    sort_order: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    stage: Mapped["Stage"] = relationship(back_populates="kits")
    sections: Mapped[list["Section"]] = relationship(back_populates="kit", cascade="all, delete-orphan")


class Section(Base):
    __tablename__ = "sections"

    id: Mapped[int] = mapped_column(primary_key=True)
    kit_id: Mapped[int] = mapped_column(ForeignKey("kits.id"))
    name: Mapped[str] = mapped_column(String(100))
    code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    sort_order: Mapped[int] = mapped_column(default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    kit: Mapped["Kit"] = relationship(back_populates="sections")
    documents: Mapped[list["Document"]] = relationship(back_populates="section")
