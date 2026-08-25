"""Tender Pydantic schemas."""
from datetime import datetime
from typing import Optional, Literal

from pydantic import BaseModel, Field, ConfigDict, field_validator


class TenderBase(BaseModel):
    """Shared tender fields."""
    model_config = ConfigDict(from_attributes=True)

    name: str = Field(..., min_length=1, max_length=255)
    customer_name: str = Field(..., min_length=1, max_length=255)
    project_type: str = Field(..., max_length=100)
    volume: Optional[float] = None
    volume_unit: Optional[str] = Field(None, max_length=20)
    complexity: Literal["low", "medium", "high"] = "medium"
    standards: Optional[list] = Field(default_factory=list)
    scope_items: Optional[list] = Field(default_factory=list)
    standard_files: Optional[list] = Field(default_factory=list)
    start_date: Optional[datetime] = None
    deadline: Optional[datetime] = None
    duration_months: Optional[int] = Field(None, ge=1, le=60)
    nmc: Optional[float] = Field(None, ge=0)
    our_price: Optional[float] = Field(None, ge=0)
    margin_pct: Optional[float] = Field(None, ge=-100, le=100)
    probability: Optional[int] = Field(None, ge=0, le=100)
    platform: Optional[str] = Field(None, max_length=100)
    region: Optional[str] = Field(None, max_length=100)
    responsible_id: Optional[int] = None
    auction_end_time: Optional[datetime] = None
    loss_reason: Optional[str] = Field(None, max_length=255)
    calculated_hours: Optional[float] = None
    calculated_cost: Optional[float] = None
    team_size: Optional[int] = Field(None, ge=1, le=100)
    team_composition: Optional[dict] = Field(default_factory=dict)


class TenderCreate(TenderBase):
    """Schema for creating a new tender."""
    stage: Optional[str] = "new"

    @field_validator("stage")
    @classmethod
    def validate_stage(cls, v: Optional[str]) -> str:
        allowed = {"new", "qualification", "preparation", "approval", "submitted", "auction", "waiting", "won", "lost", "contract"}
        if v and v not in allowed:
            raise ValueError(f"stage must be one of {allowed}")
        return v or "new"


class TenderUpdate(BaseModel):
    """Schema for updating tender fields (all optional)."""
    model_config = ConfigDict(from_attributes=True)

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    customer_name: Optional[str] = Field(None, min_length=1, max_length=255)
    project_type: Optional[str] = Field(None, max_length=100)
    volume: Optional[float] = None
    volume_unit: Optional[str] = Field(None, max_length=20)
    complexity: Optional[Literal["low", "medium", "high"]] = None
    standards: Optional[list] = None
    scope_items: Optional[list] = None
    standard_files: Optional[list] = None
    start_date: Optional[datetime] = None
    deadline: Optional[datetime] = None
    duration_months: Optional[int] = Field(None, ge=1, le=60)
    nmc: Optional[float] = Field(None, ge=0)
    our_price: Optional[float] = Field(None, ge=0)
    margin_pct: Optional[float] = Field(None, ge=-100, le=100)
    probability: Optional[int] = Field(None, ge=0, le=100)
    platform: Optional[str] = Field(None, max_length=100)
    region: Optional[str] = Field(None, max_length=100)
    responsible_id: Optional[int] = None
    auction_end_time: Optional[datetime] = None
    stage: Optional[str] = None
    loss_reason: Optional[str] = Field(None, max_length=255)
    calculated_hours: Optional[float] = None
    calculated_cost: Optional[float] = None
    team_size: Optional[int] = Field(None, ge=1, le=100)
    team_composition: Optional[dict] = None
    status: Optional[str] = None

    @field_validator("stage")
    @classmethod
    def validate_stage(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        allowed = {"new", "qualification", "preparation", "approval", "submitted", "auction", "waiting", "won", "lost", "contract"}
        if v not in allowed:
            raise ValueError(f"stage must be one of {allowed}")
        return v


class TenderStageUpdate(BaseModel):
    """Schema for PATCH /{tender_id}/stage."""
    model_config = ConfigDict(from_attributes=True)

    stage: Optional[str] = None
    status: Optional[str] = None
    our_price: Optional[float] = Field(None, ge=0)
    margin_pct: Optional[float] = Field(None, ge=-100, le=100)
    probability: Optional[int] = Field(None, ge=0, le=100)

    @field_validator("stage")
    @classmethod
    def validate_stage(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        allowed = {"new", "qualification", "preparation", "approval", "submitted", "auction", "waiting", "won", "lost", "contract"}
        if v not in allowed:
            raise ValueError(f"stage must be one of {allowed}")
        return v


class TenderListItem(BaseModel):
    """Schema for list response (lightweight)."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    customer_name: str
    project_type: str
    status: str
    stage: str
    nmc: Optional[float] = None
    our_price: Optional[float] = None
    margin_pct: Optional[float] = None
    probability: Optional[int] = None
    platform: Optional[str] = None
    region: Optional[str] = None
    deadline: Optional[str] = None
    auction_end_time: Optional[str] = None
    responsible_id: Optional[int] = None
    calculated_cost: Optional[float] = None
    created_at: Optional[str] = None


class TenderDetail(BaseModel):
    """Schema for full tender response."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    customer_name: str
    project_type: str
    volume: Optional[float] = None
    complexity: str
    standards: Optional[list] = None
    scope_items: Optional[list] = None
    standard_files: Optional[list] = None
    start_date: Optional[str] = None
    deadline: Optional[str] = None
    duration_months: Optional[int] = None
    nmc: Optional[float] = None
    our_price: Optional[float] = None
    margin_pct: Optional[float] = None
    probability: Optional[int] = None
    platform: Optional[str] = None
    region: Optional[str] = None
    responsible_id: Optional[int] = None
    auction_end_time: Optional[str] = None
    stage: str
    loss_reason: Optional[str] = None
    calculated_hours: Optional[float] = None
    calculated_cost: Optional[float] = None
    team_size: Optional[int] = None
    team_composition: Optional[dict] = None
    status: str
    created_at: Optional[str] = None


class TenderCreateResponse(BaseModel):
    """Response after creating a tender."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    status: str
    stage: str
    calculated_cost: Optional[float] = None


class TenderStageResponse(BaseModel):
    """Response after updating tender stage."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    stage: str
    status: str
    project_created: Optional[dict] = None


class TenderCalculateResponse(BaseModel):
    """Response from tender calculation."""
    model_config = ConfigDict(from_attributes=True)

    tender_id: int
    name: str
    total_hours: float
    team_size: int
    team_composition: dict
    duration_months: int
    load_chart: list

    @field_validator("load_chart", mode="before")
    @classmethod
    def _map_load_chart(cls, v):
        """Accept both 'load_chart' and 'monthly_load' keys."""
        if v is not None:
            return v
        return []  # Will be filled from monthly_load in router

class TenderProjectCreateResponse(BaseModel):
    """Response after creating project from tender."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: str
    customer_name: str
    status: str
    stage: str
    planned_finish: Optional[str] = None
    created_at: Optional[str] = None


class PortfolioSummary(BaseModel):
    """Portfolio summary response."""
    model_config = ConfigDict(from_attributes=True)
    active_count: int
    active_sum: float
    won_count: int
    won_sum: float
    win_rate: float
    auction_now: int
    pipeline: dict


class TenderDocumentPreviewCreate(BaseModel):
    """Schema for creating a tender document preview."""
    model_config = ConfigDict(from_attributes=True)

    doc_type: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=255)
    format: str = Field(default="pdf", max_length=20)
    content_data: Optional[dict] = Field(default_factory=dict)
    preview_url: Optional[str] = Field(None, max_length=500)


class TenderDocumentPreviewResponse(BaseModel):
    """Response after creating a tender document preview."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    doc_type: str
    name: str


class TenderTaskItem(BaseModel):
    """Schema for task linked to a tender."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    tender_id: int
    title: str
    assignee: Optional[str] = None
    due_date: Optional[str] = None
    status: str
    priority: str


class PaginationParams(BaseModel):
    """Common pagination query parameters."""
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)


class PaginatedTenderList(BaseModel):
    """Paginated list of tenders."""
    model_config = ConfigDict(from_attributes=True)

    items: list[TenderListItem]
    total: int
    page: int
    page_size: int
    pages: int
