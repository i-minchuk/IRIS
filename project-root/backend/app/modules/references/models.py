"""Модели справочников."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import String, Text, Integer, DateTime, ForeignKey, Index, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class GlossaryTerm(Base):
    """Термин глоссария, извлечённый из документации."""

    __tablename__ = "glossary_terms"

    id: Mapped[int] = mapped_column(primary_key=True)
    term: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    definition: Mapped[str] = mapped_column(Text, nullable=False)
    company_usage: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    where_found: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    department: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    source: Mapped[str] = mapped_column(
        String(50), nullable=False, default="ai"
    )  # ai | manual

    document_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("documents.id", ondelete="SET NULL"), nullable=True
    )
    project_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("projects.id", ondelete="SET NULL"), nullable=True
    )
    created_by_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    document: Mapped[Optional["Document"]] = relationship(
        "Document", foreign_keys=[document_id]
    )
    project: Mapped[Optional["Project"]] = relationship(
        "Project", foreign_keys=[project_id]
    )
    created_by: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[created_by_id]
    )

    __table_args__ = (
        Index("ix_glossary_terms_project_id", "project_id"),
        Index("ix_glossary_terms_department", "department"),
        Index("ix_glossary_terms_source", "source"),
    )


class Standard(Base):
    """Нормативный документ (ГОСТ, СНиП, СП, ТУ и т.п.) с извлечёнными требованиями."""

    __tablename__ = "standards"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    file_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    file_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    file_size: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    requirements: Mapped[list] = mapped_column(
        JSON, default=list, nullable=False
    )  # [{type, value, description, section}]
    source: Mapped[str] = mapped_column(
        String(50), nullable=False, default="upload"
    )  # upload | manual

    created_by_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    created_by: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[created_by_id]
    )

    __table_args__ = (
        Index("ix_standards_code", "code"),
        Index("ix_standards_source", "source"),
    )
