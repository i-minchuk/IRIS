from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class CalendarEventBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    date: date
    type: str = "personal"
    description: Optional[str] = None


class CalendarEventCreate(CalendarEventBase):
    pass


class CalendarEventOut(CalendarEventBase):
    id: int
    is_global: bool
    user_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    is_editable: bool = False

    model_config = ConfigDict(from_attributes=True)


class CalendarEventResponse(BaseModel):
    """Unified event returned to the calendar UI."""

    id: str
    title: str
    date: date
    type: str
    is_global: bool
    is_editable: bool
    source: str  # system | user
    details: dict = Field(default_factory=dict)

    model_config = ConfigDict(from_attributes=True)


class CalendarEvent(CalendarEventBase):
    """Legacy schema used by the router-generated events."""

    id: str
    title: str
    date: date
    type: str
    status: str = ""
    priority: Optional[str] = None
    customer: Optional[str] = None
    description: Optional[str] = None
    entity_id: int = 0

    model_config = ConfigDict(from_attributes=True)


class BirthdayEvent(BaseModel):
    id: str
    name: str
    date: str  # MM-DD
    role: str
    avatar: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
