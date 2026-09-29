"""Audit log model."""
from datetime import datetime
from typing import Optional

from sqlalchemy import ForeignKey, Index, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    # nullable=True — соответствует схеме БД: middleware может логировать
    # события без авторизованного пользователя (user_email отсутствует)
    user_email: Mapped[Optional[str]] = mapped_column(nullable=True)
    action: Mapped[str]
    entity_type: Mapped[str]
    entity_id: Mapped[str]
    entity_name: Mapped[str | None]
    details: Mapped[str | None]
    ip_address: Mapped[str | None]
    user_agent: Mapped[str | None]
    success: Mapped[Optional[bool]] = mapped_column(nullable=True, default=True)
    created_at: Mapped[datetime] = mapped_column(default=func.now())

    __table_args__ = (
        Index("idx_audit_user", "user_id"),
        Index("idx_audit_action", "action"),
        Index("idx_audit_entity", "entity_type", "entity_id"),
        Index("idx_audit_date", "created_at"),
    )
