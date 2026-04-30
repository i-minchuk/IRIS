"""Pydantic schemas for Remarks API."""
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict

from app.modules.remarks.models import RemarkSource, RemarkStatus, RemarkPriority, RemarkCategory


# ============== Remark Schemas ==============

class RemarkCreate(BaseModel):
    """Create remark."""
    project_id: Optional[int] = Field(None, gt=0)
    document_id: Optional[int] = Field(None, gt=0)
    revision_id: Optional[int] = Field(None, gt=0)
    workflow_step_id: Optional[int] = Field(None, gt=0)
    
    source: RemarkSource = Field(default=RemarkSource.MANUAL)
    priority: RemarkPriority = Field(default=RemarkPriority.MEDIUM)
    category: RemarkCategory = Field(default=RemarkCategory.OTHER)
    
    title: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1)
    location_ref: Optional[str] = Field(None, max_length=255)
    
    assignee_id: Optional[int] = Field(None, gt=0)
    due_date: Optional[date] = None
    tag_ids: Optional[List[int]] = Field(default_factory=list)


class RemarkUpdate(BaseModel):
    """Update remark."""
    project_id: Optional[int] = Field(None, gt=0)
    document_id: Optional[int] = Field(None, gt=0)
    revision_id: Optional[int] = Field(None, gt=0)
    
    source: Optional[RemarkSource] = None
    status: Optional[RemarkStatus] = None
    priority: Optional[RemarkPriority] = None
    category: Optional[RemarkCategory] = None
    
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    location_ref: Optional[str] = Field(None, max_length=255)
    
    assignee_id: Optional[int] = Field(None, gt=0)
    due_date: Optional[date] = None
    resolution: Optional[str] = None
    tag_ids: Optional[List[int]] = None


class RemarkHistoryEntry(BaseModel):
    """History entry for remark."""
    action: str
    user_id: int
    user_name: str
    timestamp: datetime
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    comment: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class RemarkAttachment(BaseModel):
    """Attachment for remark."""
    filename: str
    url: str
    uploaded_at: datetime
    uploaded_by: Optional[int] = None


class RemarkCommentCreate(BaseModel):
    """Create comment on remark."""
    text: str = Field(..., min_length=1)
    is_internal: bool = Field(default=True)


class RemarkCommentResponse(BaseModel):
    """Response for comment."""
    id: int
    remark_id: UUID
    author_id: int
    author_name: str
    text: str
    is_internal: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RemarkResponse(BaseModel):
    """Full remark response."""
    id: UUID
    project_id: Optional[int]
    project_name: Optional[str] = None
    document_id: Optional[int]
    document_name: Optional[str] = None
    revision_id: Optional[int]
    workflow_step_id: Optional[int]
    
    source: RemarkSource
    status: RemarkStatus
    priority: RemarkPriority
    category: RemarkCategory
    
    title: str
    description: str
    location_ref: Optional[str]
    
    author_id: int
    author_name: str
    assignee_id: Optional[int]
    assignee_name: Optional[str] = None
    
    due_date: Optional[date]
    resolution: Optional[str]
    resolved_by: Optional[int]
    resolved_by_name: Optional[str] = None
    resolved_at: Optional[datetime]
    
    parent_id: Optional[UUID]
    related_remark_ids: List[UUID]
    
    attachments: List[RemarkAttachment]
    history: List[RemarkHistoryEntry]
    
    tags: List[int] = []
    comments_count: int = 0
    
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RemarkListItem(BaseModel):
    """Light remark item for list view."""
    id: UUID
    title: str
    status: RemarkStatus
    priority: RemarkPriority
    category: RemarkCategory
    
    project_id: Optional[int]
    project_name: Optional[str] = None
    document_id: Optional[int]
    document_name: Optional[str] = None
    
    author_id: int
    author_name: str
    assignee_id: Optional[int]
    assignee_name: Optional[str] = None
    
    due_date: Optional[date]
    
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RemarkListResponse(BaseModel):
    """List of remarks with pagination."""
    remarks: List[RemarkListItem]
    total: int
    page: int
    page_size: int


# ============== Filter Schema ==============

class RemarkFilter(BaseModel):
    """Filter parameters for remarks list."""
    project_id: Optional[int] = None
    document_id: Optional[int] = None
    status: Optional[List[RemarkStatus]] = None
    priority: Optional[List[RemarkPriority]] = None
    category: Optional[List[RemarkCategory]] = None
    source: Optional[List[RemarkSource]] = None
    assignee_id: Optional[int] = None
    author_id: Optional[int] = None
    
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    
    search_text: Optional[str] = None
    tag_ids: Optional[List[int]] = None
    
    sort_by: str = Field(default='priority', description='priority, created_at, due_date, status')
    sort_order: str = Field(default='desc', description='asc or desc')
    
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


# ============== Action Schemas ==============

class RemarkAction(BaseModel):
    """Action to perform on remark."""
    action: str = Field(..., description='assign, resolve, reject, defer, reopen, close, change_priority')
    payload: Dict[str, Any] = Field(default_factory=dict)
    comment: Optional[str] = None


# ============== Statistics Schema ==============

class RemarkStatistics(BaseModel):
    """Statistics for remarks."""
    total: int
    by_status: Dict[str, int]
    by_priority: Dict[str, int]
    by_category: Dict[str, int]
    by_source: Dict[str, int]
    
    overdue_count: int
    my_open_count: int  # Open remarks assigned to current user
    
    avg_resolution_time_hours: Optional[float] = None
    
    model_config = ConfigDict(from_attributes=True)


# ============== Tag Schemas ==============

class RemarkTagCreate(BaseModel):
    """Create tag."""
    name: str = Field(..., min_length=1, max_length=100)
    color: str = Field(default='#CBD5E0', pattern=r'^#[0-9A-Fa-f]{6}$')


class RemarkTagUpdate(BaseModel):
    """Update tag."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')


class RemarkTagResponse(BaseModel):
    """Tag response."""
    id: int
    name: str
    color: str

    model_config = ConfigDict(from_attributes=True)


# ============== Export Schema ==============

class RemarkExportRow(BaseModel):
    """Row for CSV/Excel export."""
    id: str
    title: str
    status: str
    priority: str
    category: str
    source: str
    project_name: Optional[str]
    document_name: Optional[str]
    location_ref: Optional[str]
    author_name: str
    assignee_name: Optional[str]
    due_date: Optional[str]
    resolution: Optional[str]
    created_at: str
    updated_at: str
