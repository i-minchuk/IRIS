"""Release management models."""
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Text, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


def compute_checklist_progress(checklist: Optional[list]) -> int:
    """Доля выполненных обязательных (required) пунктов чек-листа, % целым."""
    if not checklist:
        return 0
    required = [item for item in checklist if isinstance(item, dict) and item.get("required")]
    if not required:
        return 0
    completed = len([item for item in required if item.get("completed")])
    return round(completed / len(required) * 100)


class Release(Base):
    __tablename__ = "releases"

    id: Mapped[int] = mapped_column(primary_key=True)
    version: Mapped[str] = mapped_column(String(50))
    name: Mapped[str] = mapped_column(String(255))
    branch: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(50), default="planning")
    # planning, development, testing, staging, ready, deployed, rolled_back
    description: Mapped[Optional[str]] = mapped_column(Text, default="")
    checklist: Mapped[list] = mapped_column(JSON, default=list)
    approved_by: Mapped[list] = mapped_column(JSON, default=list)
    deployed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    deployed_by: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    rollback_info: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    planned_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow
    )

    @property
    def checklist_progress(self) -> int:
        return compute_checklist_progress(self.checklist)
