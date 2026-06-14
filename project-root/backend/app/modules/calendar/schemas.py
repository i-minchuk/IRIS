from datetime import date

from pydantic import BaseModel, ConfigDict


class CalendarEvent(BaseModel):
    id: str
    title: str
    date: date
    type: str  # project, task, tender, birthday
    status: str
    priority: str | None = None
    customer: str | None = None
    description: str | None = None
    entity_id: int

    model_config = ConfigDict(from_attributes=True)


class BirthdayEvent(BaseModel):
    id: str
    name: str
    date: str  # MM-DD
    role: str
    avatar: str | None = None

    model_config = ConfigDict(from_attributes=True)
