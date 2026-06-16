"""Time tracking Pydantic schemas."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


class SessionStart(BaseModel):
    """Schema for starting a time session."""
    model_config = ConfigDict(from_attributes=True)

    document_id: Optional[int] = None
    project_id: Optional[int] = None


class SessionStop(BaseModel):
    """Schema for stopping a time session."""
    model_config = ConfigDict(from_attributes=True)

    active_time: Optional[int] = Field(None, ge=0)
    edit_count: int = 0
    blocks_modified: Optional[list] = Field(default_factory=list)
    variables_changed: Optional[list] = Field(default_factory=list)
    revisions_created: int = 0
    remarks_resolved: int = 0
    efficiency_score: Optional[float] = Field(None, ge=0, le=100)


class SessionListItem(BaseModel):
    """Schema for session list response."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    document_id: Optional[int] = None
    project_id: Optional[int] = None
    started_at: Optional[str] = None
    ended_at: Optional[str] = None
    total_duration: int
    active_time: int
    efficiency_score: Optional[float] = None


class SessionStartResponse(BaseModel):
    """Response after starting a session."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    started_at: Optional[str] = None


class SessionStopResponse(BaseModel):
    """Response after stopping a session."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    total_duration: int
    active_time: int
    efficiency_score: Optional[float] = None


class EmployeeAnalytics(BaseModel):
    """Employee analytics response."""
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    total_sessions: int
    total_active_time: int
    avg_efficiency: float


class PaginatedSessionList(BaseModel):
    """Paginated list of sessions."""
    model_config = ConfigDict(from_attributes=True)

    items: list[SessionListItem]
    total: int
    page: int
    page_size: int
    pages: int
