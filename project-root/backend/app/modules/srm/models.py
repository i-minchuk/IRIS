"""SRM (procurement) models: suppliers, purchase requests, contracts, orders, invoices."""
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Text, ForeignKey, DateTime, Integer, Numeric, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Supplier(Base):
    __tablename__ = "srm_suppliers"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    inn: Mapped[str] = mapped_column(String(20))
    kpp: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    ogrn: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    type: Mapped[str] = mapped_column(String(50))  # manufacturer, distributor, contractor, service_provider, customer
    category: Mapped[str] = mapped_column(String(50))  # materials, equipment, services, subcontractors, supply
    status: Mapped[str] = mapped_column(String(50), default="draft")  # draft, verification, approved, active, suspended, blacklisted, archived
    rating: Mapped[float] = mapped_column(default=0.0)
    contact_name: Mapped[str] = mapped_column(String(255))
    contact_email: Mapped[str] = mapped_column(String(255))
    contact_phone: Mapped[str] = mapped_column(String(50))
    address: Mapped[str] = mapped_column(String(500))
    website: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    verified_by_legal: Mapped[bool] = mapped_column(Boolean, default=False)
    verified_by_accountant: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )


class Customer(Base):
    """Заказчик (контрагент по договорам). Отдельное хранилище от поставщиков."""
    __tablename__ = "srm_customers"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    inn: Mapped[str] = mapped_column(String(20))
    kpp: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    ogrn: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    type: Mapped[str] = mapped_column(String(50))  # manufacturer, distributor, contractor, service_provider, customer
    category: Mapped[str] = mapped_column(String(50))  # materials, equipment, services, subcontractors, supply
    status: Mapped[str] = mapped_column(String(50), default="draft")  # draft, verification, approved, active, suspended, blacklisted, archived
    rating: Mapped[float] = mapped_column(default=0.0)
    contact_name: Mapped[str] = mapped_column(String(255))
    contact_email: Mapped[str] = mapped_column(String(255))
    contact_phone: Mapped[str] = mapped_column(String(50))
    address: Mapped[str] = mapped_column(String(500))
    website: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    verified_by_legal: Mapped[bool] = mapped_column(Boolean, default=False)
    verified_by_accountant: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )


class PurchaseRequest(Base):
    __tablename__ = "srm_purchase_requests"

    id: Mapped[int] = mapped_column(primary_key=True)
    number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    project_name: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(50), default="draft")  # draft, submitted, manager_review, director_review, approved, rejected, rfq_sent, quotation_received, comparison, po_issued, completed
    requester: Mapped[str] = mapped_column(String(255))
    amount: Mapped[float] = mapped_column(Numeric(15, 2))
    currency: Mapped[str] = mapped_column(String(3), default="RUB")
    priority: Mapped[str] = mapped_column(String(20), default="medium")  # low, medium, high, critical
    deadline: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )


class Contract(Base):
    __tablename__ = "srm_contracts"

    id: Mapped[int] = mapped_column(primary_key=True)
    number: Mapped[str] = mapped_column(String(100))
    title: Mapped[str] = mapped_column(String(255))
    supplier_id: Mapped[int] = mapped_column(ForeignKey("srm_customers.id"))  # заказчик
    supplier_name: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(50), default="draft")  # draft, legal_review, negotiation, approved, signed, active, completed, terminated
    amount: Mapped[float] = mapped_column(Numeric(15, 2))
    currency: Mapped[str] = mapped_column(String(3), default="RUB")
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    project_name: Mapped[str] = mapped_column(String(255))
    # Прикреплённый файл договора (скан/PDF)
    attachment_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    attachment_stored: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )


class PurchaseOrder(Base):
    __tablename__ = "srm_orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    number: Mapped[str] = mapped_column(String(100))
    contract_id: Mapped[int] = mapped_column(ForeignKey("srm_contracts.id"))
    supplier_name: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(50), default="draft")  # draft, submitted, confirmed, in_production, shipped, in_transit, customs, delivered, inspection, accepted, rejected, completed
    amount: Mapped[float] = mapped_column(Numeric(15, 2))
    currency: Mapped[str] = mapped_column(String(3), default="RUB")
    order_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    delivery_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    project_name: Mapped[str] = mapped_column(String(255))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )


class Invoice(Base):
    __tablename__ = "srm_invoices"

    id: Mapped[int] = mapped_column(primary_key=True)
    number: Mapped[str] = mapped_column(String(100))
    supplier_name: Mapped[str] = mapped_column(String(255))
    contract_id: Mapped[int] = mapped_column(ForeignKey("srm_contracts.id"))
    order_id: Mapped[Optional[int]] = mapped_column(ForeignKey("srm_orders.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="received")  # received, verified, approved, paid, overdue, cancelled
    amount: Mapped[float] = mapped_column(Numeric(15, 2))
    currency: Mapped[str] = mapped_column(String(3), default="RUB")
    issue_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    paid_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )
