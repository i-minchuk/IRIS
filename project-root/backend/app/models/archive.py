"""SQLAlchemy models for Archive"""
from datetime import datetime, date
from typing import Optional, List
from uuid import UUID
from decimal import Decimal

from sqlalchemy import (
    Column, String, Text, DateTime, Date, Float, Boolean,
    ForeignKey, Enum, Numeric, ARRAY, event
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB, TSVECTOR
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func

from app.database.base import Base


class ArchiveEntryType(str, Enum):
    """Типы архивных записей"""
    DOCUMENT = "document"
    REVISION = "revision"
    REMARK = "remark"
    WORKFLOW = "workflow"
    COMMENT = "comment"
    FILE_UPLOAD = "file_upload"
    PROJECT_EVENT = "project_event"
    EXTERNAL_COMMUNICATION = "external_communication"
    MEETING = "meeting"
    DECISION = "decision"
    MATERIAL = "material"
    CONSTRUCTION = "construction"
    PHOTO = "photo"
    CALCULATION = "calculation"
    CERTIFICATE = "certificate"
    HANDOVER = "handover"


class ArchiveMaterialType(str, Enum):
    """Типы материалов"""
    STEEL = "steel"
    CONCRETE = "concrete"
    REINFORCEMENT = "reinforcement"
    INSULATION = "insulation"
    FINISHING = "finishing"
    EQUIPMENT = "equipment"
    PIPE = "pipe"
    CABLE = "cable"
    OTHER = "other"


class ArchiveConstructionType(str, Enum):
    """Типы конструкций"""
    FOUNDATION = "foundation"
    COLUMN = "column"
    BEAM = "beam"
    SLAB = "slab"
    WALL = "wall"
    ROOF = "roof"
    FRAME = "frame"
    PIPELINE = "pipeline"
    ELECTRICAL = "electrical"
    OTHER = "other"


class ArchiveConstructionStatus(str, Enum):
    """Статусы конструкций"""
    PLANNED = "planned"
    IN_PRODUCTION = "in_production"
    INSTALLED = "installed"
    TESTED = "tested"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class ArchiveEntry(Base):
    """Архивная запись"""
    __tablename__ = "archive_entries"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=func.gen_random_uuid()
    )
    project_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    entry_type: Mapped[ArchiveEntryType] = mapped_column(
        Enum(ArchiveEntryType),
        nullable=False,
        index=True
    )
    source_table: Mapped[str] = mapped_column(String(100), nullable=False)
    source_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    content_snapshot: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    author_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True
    )
    tags: Mapped[List[str]] = mapped_column(
        ARRAY(String),
        nullable=False,
        server_default="{}"
    )
    search_vector = Column(TSVECTOR())
    attachments: Mapped[List[dict]] = mapped_column(
        JSONB,
        nullable=False,
        server_default="[]"
    )
    related_entry_ids: Mapped[List[UUID]] = mapped_column(
        ARRAY(PG_UUID(as_uuid=True)),
        nullable=False,
        server_default="{}"
    )
    is_pinned: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
        index=True
    )
    is_deleted: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
        index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now()
    )

    # Relationships
    project = relationship("Project", backref="archive_entries")
    author = relationship("User", backref="archive_entries")
    materials = relationship("ArchiveMaterial", backref="entry", lazy="joined")
    constructions = relationship("ArchiveConstruction", backref="entry", lazy="joined")
    search_index = relationship("ArchiveSearchIndex", backref="entry", uselist=False)

    def __repr__(self) -> str:
        return f"<ArchiveEntry(id={self.id}, type={self.entry_type.value}, title='{self.title}')>"


class ArchiveMaterial(Base):
    """Материал в архиве"""
    __tablename__ = "archive_materials"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=func.gen_random_uuid()
    )
    project_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    material_type: Mapped[ArchiveMaterialType] = mapped_column(
        Enum(ArchiveMaterialType),
        nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    specification: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    manufacturer: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    quantity: Mapped[Optional[Decimal]] = mapped_column(Numeric(precision=15, scale=3), nullable=True)
    unit: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    used_in_constructions: Mapped[List[UUID]] = mapped_column(
        ARRAY(PG_UUID(as_uuid=True)),
        nullable=False,
        server_default="{}"
    )
    certificates: Mapped[List[dict]] = mapped_column(
        JSONB,
        nullable=False,
        server_default="[]"
    )
    attached_files: Mapped[List[dict]] = mapped_column(
        JSONB,
        nullable=False,
        server_default="[]"
    )
    entry_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("archive_entries.id", ondelete="SET NULL"),
        nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now()
    )

    # Relationships
    project = relationship("Project", backref="archive_materials")

    def __repr__(self) -> str:
        return f"<ArchiveMaterial(id={self.id}, type={self.material_type.value}, name='{self.name}')>"


class ArchiveConstruction(Base):
    """Конструкция в архиве"""
    __tablename__ = "archive_constructions"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=func.gen_random_uuid()
    )
    project_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    construction_type: Mapped[ArchiveConstructionType] = mapped_column(
        Enum(ArchiveConstructionType),
        nullable=False
    )
    designation: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    materials_used: Mapped[List[UUID]] = mapped_column(
        ARRAY(PG_UUID(as_uuid=True)),
        nullable=False,
        server_default="{}"
    )
    documents_related: Mapped[List[UUID]] = mapped_column(
        ARRAY(PG_UUID(as_uuid=True)),
        nullable=False,
        server_default="{}"
    )
    status: Mapped[ArchiveConstructionStatus] = mapped_column(
        Enum(ArchiveConstructionStatus),
        nullable=False,
        default=ArchiveConstructionStatus.PLANNED
    )
    installed_at: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    tested_at: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    accepted_at: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    photos: Mapped[List[dict]] = mapped_column(
        JSONB,
        nullable=False,
        server_default="[]"
    )
    entry_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("archive_entries.id", ondelete="SET NULL"),
        nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now()
    )

    # Relationships
    project = relationship("Project", backref="archive_constructions")

    def __repr__(self) -> str:
        return f"<ArchiveConstruction(id={self.id}, type={self.construction_type.value}, name='{self.name}')>"


class ArchiveSearchIndex(Base):
    """Индекс для поиска"""
    __tablename__ = "archive_search_index"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=func.gen_random_uuid()
    )
    project_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    entry_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("archive_entries.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    material_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("archive_materials.id", ondelete="CASCADE"),
        nullable=True
    )
    construction_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("archive_constructions.id", ondelete="CASCADE"),
        nullable=True
    )
    search_text: Mapped[str] = mapped_column(Text, nullable=False)
    weight: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    indexed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now()
    )

    # Relationships
    project = relationship("Project", backref="search_index")

    def __repr__(self) -> str:
        return f"<ArchiveSearchIndex(id={self.id}, weight={self.weight})>"
