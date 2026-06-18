"""External API gateway — webhook receiver, partner management, sync."""
from __future__ import annotations

import logging
import hashlib
import hmac
import json
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Request, Header
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.db.session import get_db
from app.modules.auth.deps import get_current_active_user
from app.modules.auth.models import User
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/gateway", tags=["Integrations Gateway"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class PartnerCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    code: str = Field(..., min_length=1, max_length=50)
    webhook_url: Optional[str] = Field(None, max_length=500)
    api_key: Optional[str] = Field(None, max_length=255)
    ip_whitelist: Optional[List[str]] = Field(default_factory=list)
    is_active: bool = True


class PartnerResponse(BaseModel):
    id: str
    name: str
    code: str
    webhook_url: Optional[str] = None
    ip_whitelist: List[str]
    is_active: bool
    created_at: str


class WebhookPayload(BaseModel):
    event: str = Field(..., min_length=1)
    data: Dict[str, Any] = Field(default_factory=dict)
    timestamp: Optional[str] = None
    signature: Optional[str] = None


class SyncResult(BaseModel):
    sync_id: str
    partner_id: str
    status: str
    items_processed: int
    items_failed: int
    errors: List[str]
    started_at: str
    completed_at: Optional[str] = None


class SyncLogEntry(BaseModel):
    id: str
    partner_id: str
    event_type: str
    payload_preview: str
    status: str
    error_message: Optional[str] = None
    created_at: str


# ---------------------------------------------------------------------------
# In-memory store (replace with DB table for production)
# ---------------------------------------------------------------------------

_partners: Dict[str, Dict[str, Any]] = {}
_sync_logs: List[Dict[str, Any]] = []


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _verify_webhook_signature(payload: bytes, signature: str, secret: str) -> bool:
    """Verify HMAC-SHA256 webhook signature."""
    expected = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


def _check_ip_whitelist(client_ip: str, whitelist: List[str]) -> bool:
    """Check if IP is in whitelist."""
    if not whitelist:
        return True
    return client_ip in whitelist


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/partners", response_model=PartnerResponse)
async def create_partner(
    request: PartnerCreate,
    current_user: User = Depends(get_current_active_user),
):
    """Register new integration partner."""
    partner_id = str(uuid4())
    partner = {
        "id": partner_id,
        "name": request.name,
        "code": request.code,
        "webhook_url": request.webhook_url,
        "api_key": request.api_key,
        "ip_whitelist": request.ip_whitelist or [],
        "is_active": request.is_active,
        "created_at": datetime.now().isoformat(),
    }
    _partners[partner_id] = partner

    return PartnerResponse(
        id=partner_id,
        name=request.name,
        code=request.code,
        webhook_url=request.webhook_url,
        ip_whitelist=request.ip_whitelist or [],
        is_active=request.is_active,
        created_at=partner["created_at"],
    )


@router.get("/partners", response_model=List[PartnerResponse])
async def list_partners(
    current_user: User = Depends(get_current_active_user),
):
    """List all integration partners."""
    return [
        PartnerResponse(
            id=p["id"],
            name=p["name"],
            code=p["code"],
            webhook_url=p.get("webhook_url"),
            ip_whitelist=p.get("ip_whitelist", []),
            is_active=p["is_active"],
            created_at=p["created_at"],
        )
        for p in _partners.values()
    ]


@router.get("/partners/{partner_id}", response_model=PartnerResponse)
async def get_partner(
    partner_id: str,
    current_user: User = Depends(get_current_active_user),
):
    """Get partner details."""
    partner = _partners.get(partner_id)
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    return PartnerResponse(
        id=partner["id"],
        name=partner["name"],
        code=partner["code"],
        webhook_url=partner.get("webhook_url"),
        ip_whitelist=partner.get("ip_whitelist", []),
        is_active=partner["is_active"],
        created_at=partner["created_at"],
    )


@router.post("/webhook/{source}")
async def receive_webhook(
    source: str,
    request: Request,
    payload: WebhookPayload,
    x_signature: Optional[str] = Header(None, alias="X-Signature"),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
):
    """Receive webhook from external system."""
    client_ip = request.client.host if request.client else "unknown"

    # Find partner by code
    partner = None
    for p in _partners.values():
        if p["code"] == source:
            partner = p
            break

    if not partner:
        raise HTTPException(status_code=404, detail="Unknown source")

    if not partner["is_active"]:
        raise HTTPException(status_code=403, detail="Partner is inactive")

    # IP whitelist check
    if not _check_ip_whitelist(client_ip, partner.get("ip_whitelist", [])):
        raise HTTPException(status_code=403, detail="IP not whitelisted")

    # API key check
    if partner.get("api_key") and partner["api_key"] != x_api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")

    # Signature verification
    if x_signature and partner.get("api_key"):
        body = await request.body()
        if not _verify_webhook_signature(body, x_signature, partner["api_key"]):
            raise HTTPException(status_code=401, detail="Invalid signature")

    # Log the webhook
    log_entry = {
        "id": str(uuid4()),
        "partner_id": partner["id"],
        "event_type": payload.event,
        "payload_preview": json.dumps(payload.data)[:500],
        "status": "received",
        "error_message": None,
        "created_at": datetime.now().isoformat(),
    }
    _sync_logs.append(log_entry)

    logger.info("Webhook received from %s: event=%s", source, payload.event)

    # Process based on event type
    result = {"received": True, "event": payload.event, "source": source}

    return result


@router.post("/sync/{partner_id}", response_model=SyncResult)
async def sync_with_partner(
    partner_id: str,
    current_user: User = Depends(get_current_active_user),
):
    """Trigger sync with partner."""
    partner = _partners.get(partner_id)
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")

    sync_id = str(uuid4())
    logger.info("Starting sync with partner %s (sync_id=%s)", partner_id, sync_id)

    # Placeholder: actual sync logic would go here
    return SyncResult(
        sync_id=sync_id,
        partner_id=partner_id,
        status="completed",
        items_processed=0,
        items_failed=0,
        errors=[],
        started_at=datetime.now().isoformat(),
        completed_at=datetime.now().isoformat(),
    )


@router.get("/logs", response_model=List[SyncLogEntry])
async def get_sync_logs(
    partner_id: Optional[str] = None,
    limit: int = 50,
    current_user: User = Depends(get_current_active_user),
):
    """Get sync logs."""
    logs = _sync_logs
    if partner_id:
        logs = [l for l in logs if l["partner_id"] == partner_id]
    logs = logs[-limit:]

    return [
        SyncLogEntry(
            id=l["id"],
            partner_id=l["partner_id"],
            event_type=l["event_type"],
            payload_preview=l["payload_preview"],
            status=l["status"],
            error_message=l.get("error_message"),
            created_at=l["created_at"],
        )
        for l in logs
    ]
