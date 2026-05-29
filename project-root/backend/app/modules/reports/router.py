"""Reports API router."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.auth.deps import get_current_active_user
from app.modules.auth.models import User
from app.modules.projects.models import Project
from app.modules.tasks.models import Task
from app.modules.tenders.models import Tender
from app.modules.time_tracking.models import TimeSession, EmployeeLoad
from app.modules.documents.models import Document
from app.modules.reports.schemas import ReportRequest, ReportResponse, ReportRow, ReportTemplate

router = APIRouter(tags=["reports"])


# ---------------------------------------------------------------------------
# Helper builders
# ---------------------------------------------------------------------------

def _build_report_row(columns: list[str], data: dict[str, Any]) -> ReportRow:
    """Build a ReportRow ensuring only requested columns are present."""
    return ReportRow(columns={col: data.get(col) for col in columns})


async def _generate_projects_report(
    db: AsyncSession,
    from_date: datetime | None,
    to_date: datetime | None,
    project_id: int | None,
    user_id: int | None,
) -> ReportResponse:
    """Generate Projects report."""
    columns = [
        "id",
        "name",
        "code",
        "customer_name",
        "status",
        "stage",
        "manager_id",
        "created_at",
        "documents_count",
        "tasks_count",
    ]

    query = select(Project)
    if project_id is not None:
        query = query.where(Project.id == project_id)
    if from_date is not None:
        query = query.where(Project.created_at >= from_date)
    if to_date is not None:
        query = query.where(Project.created_at <= to_date)
    if user_id is not None:
        query = query.where(
            (Project.manager_id == user_id) | (Project.created_by_id == user_id)
        )

    result = await db.execute(query.order_by(Project.created_at.desc()))
    projects = result.scalars().all()

    rows: list[ReportRow] = []
    for project in projects:
        doc_count_result = await db.execute(
            select(func.count()).where(Document.project_id == project.id)
        )
        task_count_result = await db.execute(
            select(func.count()).where(Task.project_id == project.id)
        )
        rows.append(
            _build_report_row(
                columns,
                {
                    "id": project.id,
                    "name": project.name,
                    "code": project.code,
                    "customer_name": project.customer_name or "—",
                    "status": project.status,
                    "stage": project.stage or "—",
                    "manager_id": project.manager_id,
                    "created_at": project.created_at.isoformat() if project.created_at else "—",
                    "documents_count": doc_count_result.scalar() or 0,
                    "tasks_count": task_count_result.scalar() or 0,
                },
            )
        )

    return ReportResponse(
        template=ReportTemplate.PROJECTS.value,
        columns=columns,
        rows=rows,
        generated_at=datetime.now(timezone.utc),
    )


async def _generate_tenders_report(
    db: AsyncSession,
    from_date: datetime | None,
    to_date: datetime | None,
    project_id: int | None,
    user_id: int | None,
) -> ReportResponse:
    """Generate Tenders report."""
    columns = [
        "id",
        "name",
        "customer_name",
        "project_type",
        "stage",
        "status",
        "nmc",
        "our_price",
        "margin_pct",
        "probability",
        "platform",
        "region",
        "deadline",
        "created_at",
    ]

    query = select(Tender)
    if project_id is not None:
        query = query.where(Tender.project_id == project_id)
    if from_date is not None:
        query = query.where(Tender.created_at >= from_date)
    if to_date is not None:
        query = query.where(Tender.created_at <= to_date)
    if user_id is not None:
        query = query.where(
            (Tender.responsible_id == user_id) | (Tender.created_by_id == user_id)
        )

    result = await db.execute(query.order_by(Tender.created_at.desc()))
    tenders = result.scalars().all()

    rows: list[ReportRow] = []
    for t in tenders:
        rows.append(
            _build_report_row(
                columns,
                {
                    "id": t.id,
                    "name": t.name,
                    "customer_name": t.customer_name,
                    "project_type": t.project_type,
                    "stage": t.stage,
                    "status": t.status,
                    "nmc": t.nmc or 0,
                    "our_price": t.our_price or 0,
                    "margin_pct": t.margin_pct or 0,
                    "probability": t.probability or 0,
                    "platform": t.platform or "—",
                    "region": t.region or "—",
                    "deadline": t.deadline.isoformat() if t.deadline else "—",
                    "created_at": t.created_at.isoformat() if t.created_at else "—",
                },
            )
        )

    return ReportResponse(
        template=ReportTemplate.TENDERS.value,
        columns=columns,
        rows=rows,
        generated_at=datetime.now(timezone.utc),
    )


async def _generate_load_report(
    db: AsyncSession,
    from_date: datetime | None,
    to_date: datetime | None,
    project_id: int | None,
    user_id: int | None,
) -> ReportResponse:
    """Generate Employee Load report."""
    columns = [
        "user_id",
        "total_duration",
        "active_time",
        "idle_time",
        "edit_count",
        "revisions_created",
        "remarks_resolved",
        "efficiency_score",
        "project_id",
        "period",
    ]

    query = select(TimeSession)
    if project_id is not None:
        query = query.where(TimeSession.project_id == project_id)
    if user_id is not None:
        query = query.where(TimeSession.user_id == user_id)
    if from_date is not None:
        query = query.where(TimeSession.started_at >= from_date)
    if to_date is not None:
        query = query.where(TimeSession.started_at <= to_date)

    result = await db.execute(query.order_by(TimeSession.started_at.desc()))
    sessions = result.scalars().all()

    rows: list[ReportRow] = []
    for s in sessions:
        period = "—"
        if s.started_at:
            period = s.started_at.strftime("%Y-%m")
        rows.append(
            _build_report_row(
                columns,
                {
                    "user_id": s.user_id,
                    "total_duration": s.total_duration or 0,
                    "active_time": s.active_time or 0,
                    "idle_time": s.idle_time or 0,
                    "edit_count": s.edit_count or 0,
                    "revisions_created": s.revisions_created or 0,
                    "remarks_resolved": s.remarks_resolved or 0,
                    "efficiency_score": round(s.efficiency_score, 2) if s.efficiency_score else 0,
                    "project_id": s.project_id,
                    "period": period,
                },
            )
        )

    return ReportResponse(
        template=ReportTemplate.LOAD.value,
        columns=columns,
        rows=rows,
        generated_at=datetime.now(timezone.utc),
    )


async def _generate_finances_report(
    db: AsyncSession,
    from_date: datetime | None,
    to_date: datetime | None,
    project_id: int | None,
    user_id: int | None,
) -> ReportResponse:
    """Generate Finances report (tender-based + employee cost)."""
    columns = [
        "entity_type",
        "entity_id",
        "name",
        "nmc",
        "our_price",
        "margin_pct",
        "calculated_cost",
        "probability",
        "expected_value",
        "created_at",
    ]

    query = select(Tender)
    if project_id is not None:
        query = query.where(Tender.project_id == project_id)
    if from_date is not None:
        query = query.where(Tender.created_at >= from_date)
    if to_date is not None:
        query = query.where(Tender.created_at <= to_date)
    if user_id is not None:
        query = query.where(
            (Tender.responsible_id == user_id) | (Tender.created_by_id == user_id)
        )

    result = await db.execute(query.order_by(Tender.created_at.desc()))
    tenders = result.scalars().all()

    rows: list[ReportRow] = []
    for t in tenders:
        expected = 0.0
        if t.our_price and t.probability:
            expected = round(t.our_price * (t.probability / 100), 2)
        rows.append(
            _build_report_row(
                columns,
                {
                    "entity_type": "tender",
                    "entity_id": t.id,
                    "name": t.name,
                    "nmc": t.nmc or 0,
                    "our_price": t.our_price or 0,
                    "margin_pct": t.margin_pct or 0,
                    "calculated_cost": t.calculated_cost or 0,
                    "probability": t.probability or 0,
                    "expected_value": expected,
                    "created_at": t.created_at.isoformat() if t.created_at else "—",
                },
            )
        )

    return ReportResponse(
        template=ReportTemplate.FINANCES.value,
        columns=columns,
        rows=rows,
        generated_at=datetime.now(timezone.utc),
    )


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.post("/generate", response_model=ReportResponse)
async def generate_report(
    request: ReportRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> ReportResponse:
    """Generate a report based on the requested template and filters."""
    from_date = None
    to_date = None
    if request.from_date:
        from_date = datetime.combine(request.from_date, datetime.min.time()).replace(tzinfo=timezone.utc)
    if request.to_date:
        to_date = datetime.combine(request.to_date, datetime.max.time()).replace(tzinfo=timezone.utc)

    if request.template == ReportTemplate.PROJECTS:
        return await _generate_projects_report(
            db, from_date, to_date, request.project_id, request.user_id
        )
    elif request.template == ReportTemplate.TENDERS:
        return await _generate_tenders_report(
            db, from_date, to_date, request.project_id, request.user_id
        )
    elif request.template == ReportTemplate.LOAD:
        return await _generate_load_report(
            db, from_date, to_date, request.project_id, request.user_id
        )
    elif request.template == ReportTemplate.FINANCES:
        return await _generate_finances_report(
            db, from_date, to_date, request.project_id, request.user_id
        )

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Unknown report template: {request.template}",
    )
