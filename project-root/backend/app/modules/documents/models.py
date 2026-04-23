"""Document, revision, remark and approval workflow models."""
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    String, Text, ForeignKey, DateTime, Integer, Float, JSON, Enum, Boolean, Index
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    stage_id: Mapped[Optional[int]] = mapped_column(ForeignKey("stages.id"), nullable=True)
    kit_id: Mapped[Optional[int]] = mapped_column(ForeignKey("kits.id"), nullable=True)
    section_id: Mapped[Optional[int]] = mapped_column(ForeignKey("sections.id"), nullable=True)

    number: Mapped[str] = mapped_column(String(100), index=True)
    name: Mapped[str] = mapped_column(String(255))
    doc_type: Mapped[str] = mapped_column(String(50))  # KM, PD, AK, EM, etc.
    status: Mapped[str] = mapped_column(String(50), default="draft")  # draft, in_review, approved, crs_pending, crs_approved, archived
    crs_code: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)  # A, B, C
    crs_approved_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    crs_approved_by: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    current_revision_id: Mapped[Optional[int]] = mapped_column(nullable=True)

    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    checker_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    approver_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)

    locked_by_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    locked_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    content: Mapped[Optional[dict]] = mapped_column(JSON, default=dict)
    variables_snapshot: Mapped[Optional[dict]] = mapped_column(JSON, default=dict)

    planned_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    planned_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    actual_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    actual_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    project: Mapped["Project"] = relationship("Project", back_populates="documents")
    section: Mapped[Optional["Section"]] = relationship("Section", back_populates="documents")
    revisions: Mapped[list["Revision"]] = relationship(back_populates="document", cascade="all, delete-orphan")
    remarks: Mapped[list["Remark"]] = relationship(back_populates="document", cascade="all, delete-orphan")
    approval_workflows: Mapped[list["ApprovalWorkflow"]] = relationship(back_populates="document", cascade="all, delete-orphan")
    locked_by: Mapped[Optional["User"]] = relationship("User", foreign_keys=[locked_by_id])

    __table_args__ = (
        Index("ix_doc_project_type", "project_id", "doc_type"),
        Index("ix_doc_project_status", "project_id", "status"),
        Index("ix_doc_author_created", "author_id", "created_at"),
        Index("ix_doc_section", "section_id"),
        Index("ix_doc_status", "status"),
    )


class Revision(Base):
    __tablename__ = "revisions"

    id: Mapped[int] = mapped_column(primary_key=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("documents.id"))
    number: Mapped[str] = mapped_column(String(10))  # A, B, C... or 0, 1, 2...
    status: Mapped[str] = mapped_column(String(50), default="draft")  # draft, review, approved, superseded

    trigger_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # customer_comment, internal_review, design_change, error_fix, regulation_update, crs_response
    trigger_source_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    approved_by_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    superseded_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    changes_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    diff_before: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    diff_after: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    affected_variables: Mapped[Optional[list]] = mapped_column(JSON, default=list)
    affected_documents: Mapped[Optional[list]] = mapped_column(JSON, default=list)

    document: Mapped["Document"] = relationship(back_populates="revisions")
    change_sheet: Mapped[Optional["ChangeSheet"]] = relationship(back_populates="revision", uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_rev_document_created", "document_id", "created_at"),
    )


class ChangeSheet(Base):
    __tablename__ = "change_sheets"

    id: Mapped[int] = mapped_column(primary_key=True)
    revision_id: Mapped[int] = mapped_column(ForeignKey("revisions.id"))
    document_number: Mapped[str] = mapped_column(String(100))
    format: Mapped[str] = mapped_column(String(20), default="A4")
    title: Mapped[str] = mapped_column(String(255), default="Лист изменений")
    table_data: Mapped[Optional[dict]] = mapped_column(JSON, default=dict)
    stamp_entries: Mapped[Optional[list]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    revision: Mapped["Revision"] = relationship(back_populates="change_sheet")


class Remark(Base):
    __tablename__ = "remarks"

    id: Mapped[int] = mapped_column(primary_key=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("documents.id"))
    revision_id: Mapped[Optional[int]] = mapped_column(ForeignKey("revisions.id"), nullable=True)

    remark_type: Mapped[str] = mapped_column(String(50))  # customer, internal, auditor, regulator
    source_author_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    source_organization: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    source_department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    source_role: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    target_page: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    target_coordinates: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    target_element_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    target_text_selection: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    target_screenshot: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    severity: Mapped[str] = mapped_column(String(20))  # critical, major, minor, note
    category: Mapped[str] = mapped_column(String(50))  # material, dimension, tolerance, standard_violation, typo, other

    status: Mapped[str] = mapped_column(String(50), default="new")  # new, acknowledged, in_progress, resolved_pending, resolved_confirmed, disputed, closed, reopened
    workflow_history: Mapped[Optional[list]] = mapped_column(JSON, default=list)

    resolution_action: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # document_revision, clarification, rejection, no_action
    resolution_revision_id: Mapped[Optional[int]] = mapped_column(ForeignKey("revisions.id"), nullable=True)
    response: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    evidence: Mapped[Optional[list]] = mapped_column(JSON, default=list)
    confirmed_by_customer: Mapped[bool] = mapped_column(default=False)
    confirmed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    deadline: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    document: Mapped["Document"] = relationship(back_populates="remarks")

    __table_args__ = (
        Index("ix_remark_document_status", "document_id", "status"),
        Index("ix_remark_severity_created", "severity", "created_at"),
        Index("ix_remark_document_status_severity", "document_id", "status", "severity"),
    )


class ApprovalWorkflow(Base):
    __tablename__ = "approval_workflows"

    id: Mapped[int] = mapped_column(primary_key=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("documents.id"))
    revision_id: Mapped[Optional[int]] = mapped_column(ForeignKey("revisions.id"), nullable=True)
    route_type: Mapped[str] = mapped_column(String(50))  # KM, PD, AK, EM, etc.
    status: Mapped[str] = mapped_column(String(50), default="in_progress")  # in_progress, completed, rejected, escalated
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    document: Mapped["Document"] = relationship(back_populates="approval_workflows")
    stages: Mapped[list["ApprovalStage"]] = relationship(back_populates="workflow", cascade="all, delete-orphan")


class ApprovalStage(Base):
    __tablename__ = "approval_stages"

    id: Mapped[int] = mapped_column(primary_key=True)
    workflow_id: Mapped[int] = mapped_column(ForeignKey("approval_workflows.id"))
    stage_id: Mapped[str] = mapped_column(String(50))  # author_check, peer_review, project_lead, tech_editor, etc.
    name: Mapped[str] = mapped_column(String(100))
    role: Mapped[str] = mapped_column(String(50))
    required: Mapped[bool] = mapped_column(default=True)
    assigned_to_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="pending")  # pending, in_progress, approved, rejected, skipped
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    comments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sla_hours: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    sort_order: Mapped[int] = mapped_column(default=0)

    workflow: Mapped["ApprovalWorkflow"] = relationship(back_populates="stages")


class DocumentDependency(Base):
    __tablename__ = "document_dependencies"

    id: Mapped[int] = mapped_column(primary_key=True)
    source_document_id: Mapped[int] = mapped_column(ForeignKey("documents.id"))
    target_document_id: Mapped[int] = mapped_column(ForeignKey("documents.id"))
    dependency_type: Mapped[str] = mapped_column(String(10), default="FS")  # FS, SS, FF, SF
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
