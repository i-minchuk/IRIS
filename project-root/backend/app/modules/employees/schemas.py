"""Схемы карточек сотрудников (совместимы с фронтенд-типом EmployeeProfile)."""
from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict


class _Base(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class EmployeeProfileSchema(_Base):
    user_id: int
    position: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    hire_date: Optional[date] = None
    skills: list[str] = []
    certifications: list[str] = []
    notes: Optional[str] = None


class EmployeeProfileUpsert(_Base):
    """Частичное обновление карточки (user_id берётся из пути)."""

    position: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    hire_date: Optional[date] = None
    skills: Optional[list[str]] = None
    certifications: Optional[list[str]] = None
    notes: Optional[str] = None


class EmployeeDirectoryItem(_Base):
    """Публичная карточка контакта: учётная запись + реквизиты сотрудника."""

    user_id: int
    full_name: str
    email: str
    role: str
    position: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
