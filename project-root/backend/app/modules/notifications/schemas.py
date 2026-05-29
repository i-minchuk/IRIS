# app/modules/notifications/schemas.py
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class NotificationType:
    TASK_ASSIGNED = "task_assigned"
    REMARK_CREATED = "remark_created"
    WORKFLOW_STEP = "workflow_step"
    DEADLINE_APPROACHING = "deadline_approaching"
    DOCUMENT_APPROVED = "document_approved"


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: str
    title: str
    message: str
    is_read: bool
    created_at: datetime
    meta: Optional[dict] = None


class NotificationListResponse(BaseModel):
    items: list[NotificationResponse]
    unread_count: int


class NotificationReadResponse(BaseModel):
    ok: bool


class NotificationDeleteResponse(BaseModel):
    ok: bool
