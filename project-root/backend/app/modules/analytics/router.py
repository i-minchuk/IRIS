"""Analytics dashboard for project managers."""
from typing import Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import select, func, and_, or_, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.auth.deps import get_current_active_user
from app.modules.auth.models import User
from app.modules.projects.models import Project
from app.modules.documents.models import Document, Remark
from app.modules.time_tracking.models import TimeSession

router = APIRouter(tags=["analytics"])


@router.get("/dashboard", response_model=dict)
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return manager dashboard: KPIs, project scorecard, team performance."""

    # --- KPIs ---
    active_projects_result = await db.execute(
        select(func.count()).where(Project.status.in_(["draft", "in_progress"]))
    )
    active_projects = active_projects_result.scalar() or 0

    total_docs_result = await db.execute(select(func.count()).select_from(Document))
    total_docs = total_docs_result.scalar() or 0

    approved_docs_result = await db.execute(
        select(func.count()).where(Document.status == "approved")
    )
    approved_docs = approved_docs_result.scalar() or 0

    open_remarks_result = await db.execute(
        select(func.count()).where(~Remark.status.in_(["closed", "resolved_confirmed"]))
    )
    open_remarks = open_remarks_result.scalar() or 0

    critical_remarks_result = await db.execute(
        select(func.count()).where(
            and_(Remark.severity == "critical", ~Remark.status.in_(["closed", "resolved_confirmed"]))
        )
    )
    critical_remarks = critical_remarks_result.scalar() or 0

    # Efficiency from time tracking
    efficiency_result = await db.execute(
        select(func.avg(TimeSession.efficiency_score)).where(TimeSession.efficiency_score.isnot(None))
    )
    avg_efficiency = efficiency_result.scalar() or 0

    # --- Project Scorecard ---
    projects_result = await db.execute(select(Project))
    projects = projects_result.scalars().all()

    scorecard = []
    for project in projects:
        doc_stats = await db.execute(
            select(
                func.count().label("total"),
                func.sum(case((Document.status == "approved", 1), else_=0)).label("approved"),
            ).where(Document.project_id == project.id)
        )
        doc_row = doc_stats.mappings().one()
        total = doc_row.total or 0
        approved = doc_row.approved or 0
        progress = round((approved / total * 100), 1) if total > 0 else 0

        rem_count = await db.execute(
            select(func.count())
            .select_from(Remark)
            .join(Document)
            .where(
                and_(
                    Document.project_id == project.id,
                    ~Remark.status.in_(["closed", "resolved_confirmed"]),
                )
            )
        )
        proj_remarks = rem_count.scalar() or 0

        # Simple health score
        health = "green"
        if progress < 30 or proj_remarks > 5:
            health = "red"
        elif progress < 70 or proj_remarks > 2:
            health = "yellow"

        scorecard.append({
            "id": project.id,
            "name": project.name,
            "code": project.code,
            "status": project.status,
            "progress": progress,
            "health": health,
            "documents_total": total,
            "documents_approved": approved,
            "open_remarks": proj_remarks,
            "deadline": (project.created_at + timedelta(days=90)).isoformat() if project.created_at else None,
        })

    # --- Team Performance ---
    users_result = await db.execute(select(User))
    users = users_result.scalars().all()

    team = []
    for user in users:
        user_docs = await db.execute(
            select(func.count()).where(Document.author_id == user.id)
        )
        doc_count = user_docs.scalar() or 0

        user_remarks = await db.execute(
            select(func.count())
            .select_from(Remark)
            .join(Document)
            .where(
                and_(
                    Document.author_id == user.id,
                    ~Remark.status.in_(["closed", "resolved_confirmed"]),
                )
            )
        )
        rem_count = user_remarks.scalar() or 0

        sessions_result = await db.execute(
            select(
                func.count().label("count"),
                func.coalesce(func.avg(TimeSession.efficiency_score), 0).label("eff"),
                func.coalesce(func.sum(TimeSession.active_time), 0).label("active"),
            ).where(TimeSession.user_id == user.id)
        )
        sess = sessions_result.mappings().one()

        team.append({
            "id": user.id,
            "full_name": user.full_name or user.email,
            "role": user.role,
            "documents_count": doc_count,
            "open_remarks": rem_count,
            "sessions": sess.count or 0,
            "efficiency": round((sess.eff or 0) * 100, 1),
            "active_time_hours": round((sess.active or 0) / 3600, 1),
        })

    return {
        "kpis": {
            "active_projects": active_projects,
            "total_documents": total_docs,
            "approved_documents": approved_docs,
            "open_remarks": open_remarks,
            "critical_remarks": critical_remarks,
            "avg_efficiency": round(avg_efficiency * 100, 1),
        },
        "scorecard": scorecard,
        "team": team,
    }
