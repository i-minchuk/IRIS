"""Audit logging module — comprehensive audit trail for all system actions."""
from __future__ import annotations

import logging
import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, DateTime, JSON, Integer, Text

# Use the canonical model from app.models.audit
from app.models.audit import AuditLog
from app.db.session import get_db
from app.modules.auth.deps import get_current_active_user, is_admin
from app.modules.auth.models import User

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Audit"])


# ---------------------------------------------------------------------------
# Models (using canonical AuditLog from app.models.audit)
# ---------------------------------------------------------------------------

# AuditLog is imported from app.models.audit above

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class AuditLogCreate(BaseModel):
    action: str = Field(..., min_length=1, max_length=50)
    entity_type: str = Field(..., min_length=1, max_length=50)
    entity_id: Optional[str] = Field(None, max_length=100)
    old_value: Optional[Dict[str, Any]] = None
    new_value: Optional[Dict[str, Any]] = None


class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int]
    user_email: Optional[str]
    action: str
    entity_type: str
    entity_id: Optional[str]
    old_value: Optional[Dict[str, Any]]
    new_value: Optional[Dict[str, Any]]
    ip_address: Optional[str]
    user_agent: Optional[str]
    created_at: str


class AuditLogFilter(BaseModel):
    user_id: Optional[int] = None
    action: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    limit: int = Field(50, ge=1, le=500)
    offset: int = Field(0, ge=0)


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------

class AuditService:
    """Service for audit log operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def log(
        self,
        user_id: Optional[int],
        user_email: Optional[str],
        action: str,
        entity_type: str,
        entity_id: Optional[str] = None,
        old_value: Optional[Dict] = None,
        new_value: Optional[Dict] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AuditLog:
        """Create an audit log entry."""
        # Sanitize sensitive data
        old_value = self._sanitize(old_value)
        new_value = self._sanitize(new_value)

        entry = AuditLog(
            user_id=user_id,
            user_email=user_email,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            old_value=old_value,
            new_value=new_value,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self.db.add(entry)
        await self.db.commit()
        await self.db.refresh(entry)
        return entry

    def _sanitize(self, value: Optional[Dict]) -> Optional[Dict]:
        """Remove sensitive fields from logged data."""
        if not value:
            return value
        sensitive_keys = {'password', 'hashed_password', 'token', 'secret', 'api_key', 'refresh_token'}
        sanitized = {}
        for k, v in value.items():
            if k.lower() in sensitive_keys:
                sanitized[k] = '***REDACTED***'
            else:
                sanitized[k] = v
        return sanitized

    async def get_logs(
        self,
        user_id: Optional[int] = None,
        action: Optional[str] = None,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[AuditLog]:
        """Get audit logs with filters."""
        query = select(AuditLog).order_by(desc(AuditLog.created_at))

        if user_id:
            query = query.where(AuditLog.user_id == user_id)
        if action:
            query = query.where(AuditLog.action == action)
        if entity_type:
            query = query.where(AuditLog.entity_type == entity_type)
        if entity_id:
            query = query.where(AuditLog.entity_id == entity_id)
        if date_from:
            query = query.where(
                AuditLog.created_at >= datetime.strptime(date_from, "%Y-%m-%d")
            )
        if date_to:
            query = query.where(
                AuditLog.created_at <= datetime.strptime(date_to, "%Y-%m-%d")
            )

        query = query.limit(limit).offset(offset)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_entity_history(
        self,
        entity_type: str,
        entity_id: str,
        limit: int = 50,
    ) -> List[AuditLog]:
        """Get audit history for a specific entity."""
        query = (
            select(AuditLog)
            .where(
                and_(
                    AuditLog.entity_type == entity_type,
                    AuditLog.entity_id == entity_id,
                )
            )
            .order_by(desc(AuditLog.created_at))
            .limit(limit)
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def count_logs(
        self,
        user_id: Optional[int] = None,
        action: Optional[str] = None,
        entity_type: Optional[str] = None,
        date_from: Optional[str] = None,
    ) -> int:
        """Count audit logs with filters."""
        from sqlalchemy import func
        query = select(func.count()).select_from(AuditLog)

        if user_id:
            query = query.where(AuditLog.user_id == user_id)
        if action:
            query = query.where(AuditLog.action == action)
        if entity_type:
            query = query.where(AuditLog.entity_type == entity_type)
        if date_from:
            query = query.where(
                AuditLog.created_at >= datetime.strptime(date_from, "%Y-%m-%d")
            )

        result = await self.db.execute(query)
        return result.scalar() or 0


# ---------------------------------------------------------------------------
# Middleware helper
# ---------------------------------------------------------------------------

async def log_audit(
    db: AsyncSession,
    user_id: Optional[int],
    user_email: Optional[str],
    action: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    old_value: Optional[Dict] = None,
    new_value: Optional[Dict] = None,
    request: Optional[Request] = None,
) -> AuditLog:
    """Helper to create audit log entry."""
    ip = None
    user_agent = None
    if request:
        ip = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")

    service = AuditService(db)
    return await service.log(
        user_id=user_id,
        user_email=user_email,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        old_value=old_value,
        new_value=new_value,
        ip_address=ip,
        user_agent=user_agent,
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


def _to_response(log) -> AuditLogResponse:
    """Сериализация AuditLog; old_value/new_value могут отсутствовать в модели."""
    return AuditLogResponse(
        id=log.id,
        user_id=log.user_id,
        user_email=log.user_email,
        action=log.action,
        entity_type=log.entity_type,
        entity_id=log.entity_id,
        old_value=getattr(log, "old_value", None),
        new_value=getattr(log, "new_value", None),
        ip_address=log.ip_address,
        user_agent=log.user_agent,
        created_at=log.created_at.isoformat() if log.created_at else None,
    )


@router.get("")
async def get_audit_logs_paginated(
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Пагинированный список записей аудита. Админ видит все, остальные — свои."""
    user_id = None if is_admin(current_user) else current_user.id
    service = AuditService(db)
    logs = await service.get_logs(user_id=user_id, limit=limit, offset=offset)
    total = await service.count_logs(user_id=user_id)
    return {"items": [_to_response(log) for log in logs], "total": total}


@router.get("/logs", response_model=List[AuditLogResponse])
async def get_audit_logs(
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get audit logs with filters. Admin only."""
    if not is_admin(current_user):
        # Regular users can only see their own logs
        user_id = current_user.id

    service = AuditService(db)
    logs = await service.get_logs(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        date_from=date_from,
        date_to=date_to,
        limit=limit,
        offset=offset,
    )
    return [_to_response(log) for log in logs]


@router.get("/logs/{entity_type}/{entity_id}", response_model=List[AuditLogResponse])
async def get_entity_audit_history(
    entity_type: str,
    entity_id: str,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get audit history for a specific entity."""
    service = AuditService(db)
    logs = await service.get_entity_history(entity_type, entity_id, limit)
    return [_to_response(log) for log in logs]


@router.get("/stats")
async def get_audit_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get audit statistics. Admin only."""
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Admin access required")

    service = AuditService(db)
    total = await service.count_logs()
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_count = await service.count_logs(date_from=today)

    return {
        "total_logs": total,
        "today_logs": today_count,
    }
