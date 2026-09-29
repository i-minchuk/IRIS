"""Карточки сотрудников: профили, привязанные к учётным записям пользователей."""
from datetime import date, datetime
from typing import Optional

from sqlalchemy import String, Text, Integer, Date, DateTime, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class EmployeeProfile(Base):
    __tablename__ = "employee_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"), unique=True, index=True
    )
    position: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    department: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    hire_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    # nullable=True — соответствует схеме БД (легаси-миграции создали колонки nullable)
    skills: Mapped[Optional[list]] = mapped_column(JSON, nullable=True, default=list)
    certifications: Mapped[Optional[list]] = mapped_column(JSON, nullable=True, default=list)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow,
        nullable=True,
    )
