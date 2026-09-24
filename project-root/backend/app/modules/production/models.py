"""Модели производственного процесса: отделы, сотрудники, узлы/связи схемы, проблемы."""
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Text, Integer, Float, DateTime, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ProdDepartment(Base):
    __tablename__ = "prod_departments"

    key: Mapped[str] = mapped_column(String(50), primary_key=True)
    label: Mapped[str] = mapped_column(String(255))
    short_label: Mapped[str] = mapped_column(String(50))
    color: Mapped[str] = mapped_column(String(20))
    bg: Mapped[str] = mapped_column(String(20))
    border: Mapped[str] = mapped_column(String(20))
    lane_y: Mapped[int] = mapped_column(Integer, default=0)
    lane_h: Mapped[int] = mapped_column(Integer, default=130)
    position: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )


class ProdEmployee(Base):
    __tablename__ = "prod_employees"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(255))
    dept_key: Mapped[str] = mapped_column(String(50))
    kpi_load: Mapped[int] = mapped_column(Integer, default=0)
    user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )  # связь с учётной записью для расчёта загрузки из time tracking
    tasks: Mapped[list] = mapped_column(JSON, default=list)
    position: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )


class ProdProcessNode(Base):
    __tablename__ = "prod_process_nodes"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    label: Mapped[str] = mapped_column(String(255))
    dept_key: Mapped[str] = mapped_column(String(50))
    x: Mapped[int] = mapped_column(Integer, default=0)
    y: Mapped[int] = mapped_column(Integer, default=0)
    w: Mapped[int] = mapped_column(Integer, default=170)
    h: Mapped[int] = mapped_column(Integer, default=76)
    type: Mapped[str] = mapped_column(String(20), default="task")  # event, gateway, task
    issue: Mapped[str] = mapped_column(String(20), default="ok")  # ok, bottleneck, duplicate
    docs: Mapped[list] = mapped_column(JSON, default=list)
    employees: Mapped[list] = mapped_column(JSON, default=list)
    kpis: Mapped[list] = mapped_column(JSON, default=list)
    description: Mapped[str] = mapped_column(Text, default="")
    avg_days: Mapped[float] = mapped_column(Float, default=0.0)
    position: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )


class ProdProcessEdge(Base):
    __tablename__ = "prod_process_edges"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    from_node: Mapped[str] = mapped_column(String(50))
    to_node: Mapped[str] = mapped_column(String(50))
    type: Mapped[str] = mapped_column(String(20), default="sequence")  # sequence, conditional, message
    label: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    position: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )


class ProdProblem(Base):
    __tablename__ = "prod_problems"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    severity: Mapped[str] = mapped_column(String(20), default="warn")  # crit, warn
    tasks: Mapped[list] = mapped_column(JSON, default=list)
    description: Mapped[str] = mapped_column(Text, default="")
    recommendation: Mapped[str] = mapped_column(Text, default="")
    position: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )
