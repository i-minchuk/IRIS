"""Tender management models."""
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Text, ForeignKey, DateTime, Integer, Float, JSON, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Tender(Base):
    __tablename__ = "tenders"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    customer_name: Mapped[str] = mapped_column(String(255))
    project_type: Mapped[str] = mapped_column(String(100))  # KM, PD, montazh, etc.
    volume: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # tons, m2, etc.
    volume_unit: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    complexity: Mapped[str] = mapped_column(String(20), default="medium")  # low, medium, high
    standards: Mapped[Optional[list]] = mapped_column(JSON, default=list)
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    deadline: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_months: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Portfolio / Pipeline fields
    stage: Mapped[str] = mapped_column(String(50), default="new")  # new, qualification, preparation, approval, submitted, auction, waiting, won, lost, contract
    nmc: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # начальная максимальная цена
    our_price: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    margin_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    probability: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 0-100
    platform: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # ЕИС, Сбер, РТС и т.д.
    region: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    responsible_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    auction_end_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    loss_reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    calculated_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    calculated_cost: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    team_size: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    team_composition: Mapped[Optional[dict]] = mapped_column(JSON, default=dict)

    status: Mapped[str] = mapped_column(String(50), default="draft")  # draft, review, approved, sent, won, lost, archived
    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )


class TenderDocumentPreview(Base):
    __tablename__ = "tender_document_previews"

    id: Mapped[int] = mapped_column(primary_key=True)
    tender_id: Mapped[int] = mapped_column(ForeignKey("tenders.id"))
    doc_type: Mapped[str] = mapped_column(String(50))  # assembly_drawing, specification, passport, manual, etc.
    name: Mapped[str] = mapped_column(String(255))
    format: Mapped[str] = mapped_column(String(20), default="pdf")
    content_data: Mapped[Optional[dict]] = mapped_column(JSON, default=dict)
    preview_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
