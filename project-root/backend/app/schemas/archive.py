"""Pydantic schemas for Archive API"""
from datetime import datetime, date
from typing import Optional, List, Any
from uuid import UUID
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field
from enum import Enum


# Enums
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


# Attachment schemas
class AttachmentCreate(BaseModel):
    """Создание вложения"""
    filename: str
    url: str
    type: str
    size: int


class AttachmentResponse(AttachmentCreate):
    """Ответ с вложением"""
    model_config = ConfigDict(from_attributes=True)


# Certificate schemas
class CertificateCreate(BaseModel):
    """Создание сертификата"""
    number: str
    issued_at: datetime
    valid_until: datetime
    url: str


class CertificateResponse(CertificateCreate):
    """Ответ с сертификатом"""
    model_config = ConfigDict(from_attributes=True)


# Archive Entry schemas
class ArchiveEntryCreate(BaseModel):
    """Создание архивной записи"""
    project_id: UUID
    entry_type: ArchiveEntryType
    source_table: str
    source_id: UUID
    title: str = Field(..., max_length=255)
    description: Optional[str] = None
    content_snapshot: Optional[dict] = None
    occurred_at: Optional[datetime] = None
    tags: List[str] = Field(default_factory=list)
    attachments: List[AttachmentCreate] = Field(default_factory=list)
    related_entry_ids: List[UUID] = Field(default_factory=list)
    is_pinned: bool = False


class ArchiveEntryUpdate(BaseModel):
    """Обновление архивной записи"""
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    content_snapshot: Optional[dict] = None
    tags: Optional[List[str]] = None
    attachments: Optional[List[AttachmentCreate]] = None
    related_entry_ids: Optional[List[UUID]] = None
    is_pinned: Optional[bool] = None


class ArchiveEntryResponse(BaseModel):
    """Ответ архивной записи"""
    id: UUID
    project_id: UUID
    entry_type: ArchiveEntryType
    source_table: str
    source_id: UUID
    title: str
    description: Optional[str]
    content_snapshot: Optional[dict]
    author_id: Optional[UUID]
    occurred_at: datetime
    tags: List[str]
    attachments: List[AttachmentResponse]
    related_entry_ids: List[UUID]
    is_pinned: bool
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Archive Material schemas
class ArchiveMaterialCreate(BaseModel):
    """Создание материала"""
    project_id: UUID
    material_type: ArchiveMaterialType
    name: str = Field(..., max_length=255)
    specification: Optional[str] = Field(None, max_length=500)
    manufacturer: Optional[str] = Field(None, max_length=255)
    quantity: Optional[Decimal] = None
    unit: Optional[str] = Field(None, max_length=50)
    used_in_constructions: List[UUID] = Field(default_factory=list)
    certificates: List[CertificateCreate] = Field(default_factory=list)
    attached_files: List[AttachmentCreate] = Field(default_factory=list)
    entry_id: Optional[UUID] = None


class ArchiveMaterialUpdate(BaseModel):
    """Обновление материала"""
    name: Optional[str] = Field(None, max_length=255)
    specification: Optional[str] = Field(None, max_length=500)
    manufacturer: Optional[str] = Field(None, max_length=255)
    quantity: Optional[Decimal] = None
    unit: Optional[str] = Field(None, max_length=50)
    used_in_constructions: Optional[List[UUID]] = None
    certificates: Optional[List[CertificateCreate]] = None
    attached_files: Optional[List[AttachmentCreate]] = None


class ArchiveMaterialResponse(BaseModel):
    """Ответ материала"""
    id: UUID
    project_id: UUID
    material_type: ArchiveMaterialType
    name: str
    specification: Optional[str]
    manufacturer: Optional[str]
    quantity: Optional[Decimal]
    unit: Optional[str]
    used_in_constructions: List[UUID]
    certificates: List[CertificateResponse]
    attached_files: List[AttachmentResponse]
    entry_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Archive Construction schemas
class ArchiveConstructionCreate(BaseModel):
    """Создание конструкции"""
    project_id: UUID
    name: str = Field(..., max_length=255)
    construction_type: ArchiveConstructionType
    designation: Optional[str] = Field(None, max_length=100)
    location: Optional[str] = Field(None, max_length=255)
    materials_used: List[UUID] = Field(default_factory=list)
    documents_related: List[UUID] = Field(default_factory=list)
    status: ArchiveConstructionStatus = ArchiveConstructionStatus.PLANNED
    installed_at: Optional[date] = None
    tested_at: Optional[date] = None
    accepted_at: Optional[date] = None
    photos: List[AttachmentCreate] = Field(default_factory=list)
    entry_id: Optional[UUID] = None


class ArchiveConstructionUpdate(BaseModel):
    """Обновление конструкции"""
    name: Optional[str] = Field(None, max_length=255)
    construction_type: Optional[ArchiveConstructionType] = None
    designation: Optional[str] = Field(None, max_length=100)
    location: Optional[str] = Field(None, max_length=255)
    materials_used: Optional[List[UUID]] = None
    documents_related: Optional[List[UUID]] = None
    status: Optional[ArchiveConstructionStatus] = None
    installed_at: Optional[date] = None
    tested_at: Optional[date] = None
    accepted_at: Optional[date] = None
    photos: Optional[List[AttachmentCreate]] = None


class ArchiveConstructionResponse(BaseModel):
    """Ответ конструкции"""
    id: UUID
    project_id: UUID
    name: str
    construction_type: ArchiveConstructionType
    designation: Optional[str]
    location: Optional[str]
    materials_used: List[UUID]
    documents_related: List[UUID]
    status: ArchiveConstructionStatus
    installed_at: Optional[date]
    tested_at: Optional[date]
    accepted_at: Optional[date]
    photos: List[AttachmentResponse]
    entry_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Filter schemas
class ArchiveFilter(BaseModel):
    """Фильтры для архива"""
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    entry_types: List[ArchiveEntryType] = Field(default_factory=list)
    authors: List[UUID] = Field(default_factory=list)
    has_attachments: bool = False
    is_pinned: Optional[bool] = None
    search_text: Optional[str] = None


# Statistics schemas
class ArchiveStatistics(BaseModel):
    """Статистика по проекту"""
    total_entries: int
    by_type: dict[str, int]
    by_month: dict[str, int]
    materials_count: int
    constructions_count: int


# Search schemas
class ArchiveSearchQuery(BaseModel):
    """Запрос поиска"""
    q: str
    project_id: UUID
    filters: Optional[ArchiveFilter] = None
    limit: int = 20
    offset: int = 0


class SearchResultItem(BaseModel):
    """Элемент результата поиска"""
    id: UUID
    type: str  # 'entry', 'material', 'construction'
    title: str
    description: Optional[str]
    occurred_at: datetime
    relevance: float
    highlight: Optional[str]


class ArchiveSearchResult(BaseModel):
    """Результат поиска"""
    entries: List[ArchiveEntryResponse]
    materials: List[ArchiveMaterialResponse]
    constructions: List[ArchiveConstructionResponse]
    total: int
    facets: dict[str, Any]


# Export schema
class ArchiveExport(BaseModel):
    """Параметры экспорта"""
    format: str = Field(..., pattern="^(pdf|excel)$")
    filters: Optional[ArchiveFilter] = None


# Timeline schema
class TimelineEvent(BaseModel):
    """Событие таймлайна"""
    id: UUID
    type: str
    title: str
    occurred_at: datetime
    author_name: Optional[str]
    data: dict


class TimelineResponse(BaseModel):
    """Ответ таймлайна"""
    events: List[TimelineEvent]
    total: int
