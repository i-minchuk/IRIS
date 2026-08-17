"""Support module schemas."""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


# ---------- SupportTicket ----------


class SupportTicketBase(BaseModel):
    title: str
    description: str = ""
    status: str = "new"
    priority: str = "medium"
    requester: str
    assignee: Optional[str] = None
    category: str = "general"
    tags: List[str] = []
    sla_deadline: Optional[datetime] = None


class SupportTicketCreate(SupportTicketBase):
    pass


class SupportTicketUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    requester: Optional[str] = None
    assignee: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    sla_deadline: Optional[datetime] = None
    resolved_at: Optional[datetime] = None


class SupportTicketResponse(SupportTicketBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


# ---------- Incident ----------


class IncidentTimelineEvent(BaseModel):
    time: str
    event: str


class Postmortem(BaseModel):
    summary: str
    root_cause: str = ""
    resolution: str = ""
    lessons_learned: List[str] = []
    action_items: List[dict] = []
    created_at: Optional[str] = None


class IncidentBase(BaseModel):
    title: str
    description: str = ""
    severity: str = "p3_minor"
    status: str = "detected"
    affected_systems: List[str] = []
    lead: str
    timeline: List[IncidentTimelineEvent] = []
    postmortem: Optional[Postmortem] = None


class IncidentCreate(IncidentBase):
    detected_at: Optional[datetime] = None


class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    affected_systems: Optional[List[str]] = None
    lead: Optional[str] = None
    timeline: Optional[List[IncidentTimelineEvent]] = None
    postmortem: Optional[Postmortem] = None
    resolved_at: Optional[datetime] = None


class IncidentResponse(IncidentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    detected_at: datetime
    resolved_at: Optional[datetime] = None


# ---------- KBArticle ----------


class KBArticleBase(BaseModel):
    title: str
    category: str
    subcategory: str = ""
    content: str = ""
    tags: List[str] = []
    author: str


class KBArticleCreate(KBArticleBase):
    pass


class KBArticleUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None
    author: Optional[str] = None
    helpful_count: Optional[int] = None


class KBArticleResponse(KBArticleBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    views: int
    helpful_count: int
    updated_at: datetime
