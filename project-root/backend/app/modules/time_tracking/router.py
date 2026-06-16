"""Time tracking API router."""
from typing import Optional
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from app.modules.auth.deps import get_current_active_user
from app.modules.auth.models import User
from app.modules.time_tracking.models import TimeSession, EmployeeLoad
from app.modules.time_tracking.schemas import (
    SessionStart,
    SessionStop,
    SessionListItem,
    SessionStartResponse,
    SessionStopResponse,
    EmployeeAnalytics,
    PaginatedSessionList,
)

router = APIRouter(tags=["time-tracking"])


@router.get("/sessions", response_model=PaginatedSessionList)
async def list_sessions(
    user_id: Optional[int] = None,
    project_id: Optional[int] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    # Count query
    count_query = select(func.count(TimeSession.id))
    if user_id:
        count_query = count_query.where(TimeSession.user_id == user_id)
    if project_id:
        count_query = count_query.where(TimeSession.project_id == project_id)
    total = await db.scalar(count_query) or 0

    # Data query
    query = select(TimeSession)
    if user_id:
        query = query.where(TimeSession.user_id == user_id)
    if project_id:
        query = query.where(TimeSession.project_id == project_id)
    offset = (page - 1) * page_size
    query = query.order_by(TimeSession.started_at.desc()).offset(offset).limit(page_size)
    result = await db.execute(query)
    sessions = result.scalars().all()

    items = [
        SessionListItem(
            id=s.id,
            user_id=s.user_id,
            document_id=s.document_id,
            project_id=s.project_id,
            started_at=s.started_at.isoformat() if s.started_at else None,
            ended_at=s.ended_at.isoformat() if s.ended_at else None,
            total_duration=s.total_duration,
            active_time=s.active_time,
            efficiency_score=s.efficiency_score,
        )
        for s in sessions
    ]
    pages = (total + page_size - 1) // page_size
    return PaginatedSessionList(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.post("/sessions/start", response_model=SessionStartResponse)
async def start_session(
    data: SessionStart,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    session = TimeSession(
        user_id=current_user.id,
        document_id=data.document_id,
        project_id=data.project_id,
        started_at=datetime.now(timezone.utc),
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return SessionStartResponse(
        id=session.id,
        started_at=session.started_at.isoformat() if session.started_at else None,
    )


@router.post("/sessions/{session_id}/stop", response_model=SessionStopResponse)
async def stop_session(
    session_id: int,
    data: SessionStop,
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
    session.ended_at = datetime.now(timezone.utc)
    session.total_duration = int((session.ended_at - session.started_at).total_seconds())
    session.active_time = data.active_time if data.active_time is not None else session.total_duration
    session.idle_time = session.total_duration - session.active_time
    session.edit_count = data.edit_count
    session.blocks_modified = data.blocks_modified or []
    session.variables_changed = data.variables_changed or []
    session.revisions_created = data.revisions_created
    session.remarks_resolved = data.remarks_resolved
    session.efficiency_score = data.efficiency_score
    await db.commit()
    return SessionStopResponse(
        id=session.id,
        total_duration=session.total_duration,
        active_time=session.active_time,
        efficiency_score=session.efficiency_score,
    )


@router.get("/analytics/employee/{user_id}", response_model=EmployeeAnalytics)
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
    return EmployeeAnalytics(
        user_id=user_id,
        total_sessions=row.total_sessions or 0,
        total_active_time=row.total_active_time or 0,
        avg_efficiency=float(row.avg_efficiency) if row.avg_efficiency else 0,
    )
