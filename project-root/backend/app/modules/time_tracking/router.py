"""Time tracking API router."""
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from app.modules.auth.deps import get_current_active_user
from app.modules.auth.models import User
from app.modules.time_tracking.models import TimeSession, EmployeeLoad

router = APIRouter(tags=["time-tracking"])


@router.get("/sessions", response_model=list)
async def list_sessions(
    user_id: Optional[int] = None,
    project_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    query = select(TimeSession)
    if user_id:
        query = query.where(TimeSession.user_id == user_id)
    if project_id:
        query = query.where(TimeSession.project_id == project_id)
    result = await db.execute(query.order_by(TimeSession.started_at.desc()))
    sessions = result.scalars().all()
    return [
        {
            "id": s.id,
            "user_id": s.user_id,
            "document_id": s.document_id,
            "project_id": s.project_id,
            "started_at": s.started_at.isoformat() if s.started_at else None,
            "ended_at": s.ended_at.isoformat() if s.ended_at else None,
            "total_duration": s.total_duration,
            "active_time": s.active_time,
            "efficiency_score": s.efficiency_score,
        }
        for s in sessions
    ]


@router.post("/sessions/start", response_model=dict)
async def start_session(
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    session = TimeSession(
        user_id=current_user.id,
        document_id=data.get("document_id"),
        project_id=data.get("project_id"),
        started_at=datetime.utcnow(),
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return {"id": session.id, "started_at": session.started_at.isoformat()}


@router.post("/sessions/{session_id}/stop", response_model=dict)
async def stop_session(
    session_id: int,
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(TimeSession).where(
            TimeSession.id == session_id, TimeSession.user_id == current_user.id
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.ended_at = datetime.utcnow()
    session.total_duration = int((session.ended_at - session.started_at).total_seconds())
    session.active_time = data.get("active_time", session.total_duration)
    session.idle_time = session.total_duration - session.active_time
    session.edit_count = data.get("edit_count", 0)
    session.blocks_modified = data.get("blocks_modified", [])
    session.variables_changed = data.get("variables_changed", [])
    session.revisions_created = data.get("revisions_created", 0)
    session.remarks_resolved = data.get("remarks_resolved", 0)
    session.efficiency_score = data.get("efficiency_score")
    await db.commit()
    return {
        "id": session.id,
        "total_duration": session.total_duration,
        "active_time": session.active_time,
        "efficiency_score": session.efficiency_score,
    }


@router.get("/analytics/employee/{user_id}", response_model=dict)
async def employee_analytics(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(
            func.count(TimeSession.id).label("total_sessions"),
            func.sum(TimeSession.active_time).label("total_active_time"),
            func.avg(TimeSession.efficiency_score).label("avg_efficiency"),
        ).where(TimeSession.user_id == user_id)
    )
    row = result.one_or_none()
    return {
        "user_id": user_id,
        "total_sessions": row.total_sessions or 0,
        "total_active_time": row.total_active_time or 0,
        "avg_efficiency": float(row.avg_efficiency) if row.avg_efficiency else 0,
    }
