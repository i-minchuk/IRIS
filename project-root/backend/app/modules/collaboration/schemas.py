"""WebSocket message schemas for real-time collaboration."""
from typing import Literal, Optional
from pydantic import BaseModel


class WSPresencePayload(BaseModel):
    page: Optional[str] = None
    document_id: Optional[int] = None


class WSSubscribePayload(BaseModel):
    document_id: int


class WSMessage(BaseModel):
    type: Literal[
        "presence_join",
        "presence_leave",
        "presence_update",
        "subscribe_document",
        "unsubscribe_document",
        "document_locked",
        "document_unlocked",
        "document_subscribers",
        "ping",
        "pong",
        "error",
    ]
    payload: Optional[dict] = None
