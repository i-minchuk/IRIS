"""Analytics dashboard for project managers."""
from typing import Optional
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, and_, or_, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.auth.deps import get_current_active_user
from app.modules.auth.models import User
from app.modules.projects.models import Project
from app.modules.documents.models import Document
from app.modules.remarks.models import Remark
from app.modules.time_tracking.models import TimeSession
from app.modules.tenders.models import Tender
from app.modules.gamification.models import GamificationEvent
from app.modules.analytics.schemas import (
    DepartmentEmployee,
    DepartmentLoadData,
    DepartmentLoadItem,
    TeamTimeAnalytics,
)
from app.modules.tasks.models import Task
from app.core.cache import cache_response


async def _get_db():
    """Return get_db dependency for analytics endpoints."""
    async for session in get_db():
        yield session

router = APIRouter(tags=["analytics"])


# Period parsing helpers
_PERIOD_STARTS = {
    "today": timedelta(days=0),
    "week": timedelta(days=7),
    "month": timedelta(days=30),
    "quarter": timedelta(days=90),
    "year": timedelta(days=365),
}


def _parse_period_start(period: str | None) -> datetime | None:
    """Return UTC start datetime for a named period, or None for all time."""
    if not period or period == "all":
        return None
    delta = _PERIOD_STARTS.get(period)
    if not delta:
        return None
    now = datetime.now(timezone.utc)
    if period == "today":
        return now.replace(hour=0, minute=0, second=0, microsecond=0)
    return now - delta


@router.get("/dashboard", response_model=dict)
@cache_response(expire_seconds=300)
async def get_dashboard(
    db: AsyncSession = Depends(_get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return manager dashboard: KPIs, project scorecard, team performance."""

    # --- KPIs ---
    active_projects_result = await db.execute(
        select(func.count()).where(Project.status.in_(["draft", "in_progress", "active", "planning"]))
    )
    active_projects = active_projects_result.scalar() or 0

    total_docs_result = await db.execute(select(func.count()).select_from(Document))
    total_docs = total_docs_result.scalar() or 0

    approved_docs_result = await db.execute(
        select(func.count()).where(Document.status == "approved")
    )
    approved_docs = approved_docs_result.scalar() or 0

    open_remarks_result = await db.execute(
        select(func.count()).where(~Remark.status.in_(["closed", "resolved"]))
    )
    open_remarks = open_remarks_result.scalar() or 0

    critical_remarks_result = await db.execute(
        select(func.count()).where(
            and_(Remark.priority == "critical", ~Remark.status.in_(["closed", "resolved"]))
        )
    )
    critical_remarks = critical_remarks_result.scalar() or 0

    # Efficiency from time tracking
    efficiency_result = await db.execute(
        select(func.avg(TimeSession.efficiency_score)).where(TimeSession.efficiency_score.isnot(None))
    )
    avg_efficiency = efficiency_result.scalar() or 0

    # --- Project Scorecard ---
    # Single query for all project document stats
    from sqlalchemy import literal_column
    
    doc_stats_result = await db.execute(
        select(
            Document.project_id,
            func.count().label("total"),
            func.sum(case((Document.status == "approved", 1), else_=0)).label("approved"),
        ).group_by(Document.project_id)
    )
    doc_stats_by_project = {row.project_id: row for row in doc_stats_result.mappings().all()}
    
    # Single query for all project remark counts
    rem_stats_result = await db.execute(
        select(
            Document.project_id,
            func.count().label("open_remarks"),
        )
        .select_from(Remark)
        .join(Document, Remark.document_id == Document.id)
        .where(~Remark.status.in_(["closed", "resolved"]))
        .group_by(Document.project_id)
    )
    rem_stats_by_project = {row.project_id: row.open_remarks for row in rem_stats_result.mappings().all()}
    
    projects_result = await db.execute(select(Project))
    projects = projects_result.scalars().all()

    scorecard = []
    for project in projects:
        doc_row = doc_stats_by_project.get(project.id)
        total = doc_row.total if doc_row else 0
        approved = doc_row.approved if doc_row else 0
        progress = round((approved / total * 100), 1) if total > 0 else 0
        proj_remarks = rem_stats_by_project.get(project.id, 0)

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
            "deadline": project.planned_finish.isoformat() if project.planned_finish else None,
        })

    # --- Team Performance ---
    # Batch queries for team stats
    doc_counts_result = await db.execute(
        select(Document.author_id, func.count().label("count"))
        .group_by(Document.author_id)
    )
    doc_counts = {row.author_id: row.count for row in doc_counts_result.all()}
    
    rem_counts_result = await db.execute(
        select(Document.author_id, func.count().label("count"))
        .select_from(Remark)
        .join(Document, Remark.document_id == Document.id)
        .where(~Remark.status.in_(["closed", "resolved"]))
        .group_by(Document.author_id)
    )
    rem_counts = {row.author_id: row.count for row in rem_counts_result.all()}
    
    session_stats_result = await db.execute(
        select(
            TimeSession.user_id,
            func.count().label("count"),
            func.coalesce(func.avg(TimeSession.efficiency_score), 0).label("eff"),
            func.coalesce(func.sum(TimeSession.active_time), 0).label("active"),
        ).group_by(TimeSession.user_id)
    )
    session_stats = {
        row.user_id: row 
        for row in session_stats_result.mappings().all()
    }
    
    users_result = await db.execute(select(User))
    users = users_result.scalars().all()

    team = []
    for user in users:
        sess = session_stats.get(user.id)
        team.append({
            "id": user.id,
            "full_name": user.full_name or user.email,
            "role": user.role,
            "documents_count": doc_counts.get(user.id, 0),
            "open_remarks": rem_counts.get(user.id, 0),
            "sessions": sess.count if sess else 0,
            "efficiency": round((sess.eff if sess else 0) * 100, 1),
            "active_time_hours": round((sess.active if sess else 0) / 3600, 1),
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


@router.get("/kpi", response_model=dict)
@cache_response(expire_seconds=300)
async def get_kpi_tiles(
    db: AsyncSession = Depends(_get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return 6 KPI tiles for the executive dashboard."""

    # --- Tile 1: Personnel Load ---
    # Use time tracking efficiency as proxy
    efficiency_result = await db.execute(
        select(func.avg(TimeSession.efficiency_score)).where(TimeSession.efficiency_score.isnot(None))
    )
    avg_efficiency = efficiency_result.scalar() or 0
    personnel_load = round(avg_efficiency * 100, 0)

    sessions_result = await db.execute(
        select(func.count()).where(TimeSession.efficiency_score.isnot(None))
    )
    rated_sessions = sessions_result.scalar() or 0

    personnel_status = "green" if personnel_load > 80 else "yellow" if personnel_load >= 60 else "red"

    # --- Tile 2: Projects in Work ---
    active_result = await db.execute(
        select(func.count()).where(Project.status == "active")
    )
    active_count = active_result.scalar() or 0

    at_risk_result = await db.execute(
        select(func.count()).where(Project.status == "at_risk")
    )
    at_risk_count = at_risk_result.scalar() or 0

    critical_result = await db.execute(
        select(func.count()).where(Project.status == "critical")
    )
    critical_count = critical_result.scalar() or 0

    total_work = active_count + at_risk_count + critical_count
    on_time = max(0, total_work - at_risk_count - critical_count)

    risk_pct = (at_risk_count + critical_count) / total_work * 100 if total_work > 0 else 0
    project_status = "green" if risk_pct < 20 else "yellow" if risk_pct <= 50 else "red"

    # --- Tile 3: Active Tenders ---
    tender_result = await db.execute(
        select(func.count()).where(~Tender.status.in_(["closed", "archived", "lost", "won"]))
    )
    active_tenders = tender_result.scalar() or 0

    draft_tenders_result = await db.execute(
        select(func.count()).where(Tender.status == "draft")
    )
    draft_tenders = draft_tenders_result.scalar() or 0

    sent_tenders_result = await db.execute(
        select(func.count()).where(Tender.status == "sent")
    )
    sent_tenders = sent_tenders_result.scalar() or 0

    overdue_tenders_result = await db.execute(
        select(func.count()).where(
            and_(
                Tender.deadline.isnot(None),
                Tender.deadline < datetime.now(timezone.utc),
                ~Tender.status.in_(["won", "lost", "cancelled", "archived"]),
            )
        )
    )
    overdue_tenders = overdue_tenders_result.scalar() or 0
    tender_status = "green" if overdue_tenders < 3 else "yellow" if overdue_tenders <= 5 else "red"

    # --- Tile 4: Overdue Documents ---
    # Documents not approved and older than 30 days
    overdue_docs_result = await db.execute(
        select(func.count()).where(
            and_(
                Document.status != "approved",
                Document.created_at < datetime.now(timezone.utc) - timedelta(days=30),
            )
        )
    )
    overdue_docs = overdue_docs_result.scalar() or 0
    doc_status = "red" if overdue_docs > 0 else "green"

    # --- Tile 5: FPY OTK ---
    # TODO: no data source yet — returning empty
    fpy = 0.0
    fpy_status = "green" if fpy > 95 else "yellow" if fpy >= 90 else "red"

    # --- Tile 6: Shipments Week ---
    # TODO: no data source yet — returning empty
    shipments_done = 0
    shipments_plan = 0
    ship_pct = (shipments_done / shipments_plan * 100) if shipments_plan > 0 else 0
    ship_status = "green" if ship_pct >= 80 else "yellow" if ship_pct >= 50 else "red"

    return {
        "tiles": [
            {
                "id": "personnel_load",
                "label": "Загруженность персонала",
                "value": f"{int(personnel_load)}%",
                "trend": None,
                "trend_direction": None,
                "status": personnel_status,
                "subtext": f"По данным {rated_sessions} сессий учёта времени",
            },
            {
                "id": "projects_work",
                "label": "Проектов в работе",
                "value": str(total_work),
                "trend": None,
                "trend_direction": None,
                "status": project_status,
                "subtext": f"В срок: {on_time} | Риск: {at_risk_count} | Критично: {critical_count}",
            },
            {
                "id": "tenders_active",
                "label": "Тендеров активно",
                "value": str(active_tenders),
                "trend": None,
                "trend_direction": None,
                "status": tender_status,
                "subtext": f"На подготовке: {draft_tenders} | Подано: {sent_tenders} | Просрочено: {overdue_tenders}",
            },
            {
                "id": "overdue_docs",
                "label": "Просроченных документов",
                "value": str(overdue_docs),
                "trend": None,
                "trend_direction": None,
                "status": doc_status,
                "subtext": "Не согласованы более 30 дней",
                "clickable": True,
            },
            {
                "id": "fpy_otk",
                "label": "FPY ОТК (первый проход)",
                "value": f"{fpy}%",
                "trend": None,
                "trend_direction": None,
                "status": fpy_status,
                "subtext": "Цель: >95% | Брак: 0% | Повторная приёмка: 0",
            },
            {
                "id": "shipments_week",
                "label": "Отгрузок неделя",
                "value": f"{shipments_done}/{shipments_plan}",
                "trend": None,
                "trend_direction": None,
                "status": ship_status,
                "subtext": "Готово: 0 | В пути: 0 | Задержка: 0",
            },
        ]
    }


# Человекочитаемые названия типов объектов и палитра для графиков портфеля
_PROJECT_TYPE_LABELS = {
    "KM": "Металлоконструкции (КМ)",
    "KMD": "Деталировка (КМД)",
    "PD": "Проектная документация",
    "montazh": "Монтаж",
}
_PORTFOLIO_COLORS = ["#3B82F6", "#0C7205", "#D4AF37", "#8B5CF6", "#0EA5E9", "#DC2626"]


@router.get("/portfolio", response_model=dict)
@cache_response(expire_seconds=300)
async def get_portfolio(
    db: AsyncSession = Depends(_get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Структура портфеля по типам объектов: доля и выручка по тендерам."""

    result = await db.execute(
        select(
            Tender.project_type,
            Tender.calculated_cost,
            Tender.our_price,
            Tender.nmc,
        ).where(~Tender.status.in_(["cancelled", "archived"]))
    )
    rows = result.all()

    revenue_by_type: dict[str, float] = {}
    for project_type, calc_cost, our_price, nmc in rows:
        value = our_price or calc_cost or nmc or 0.0
        revenue_by_type[project_type] = revenue_by_type.get(project_type, 0.0) + value

    total = sum(revenue_by_type.values())
    items = []
    for idx, (project_type, revenue) in enumerate(
        sorted(revenue_by_type.items(), key=lambda kv: kv[1], reverse=True)
    ):
        items.append(
            {
                "type": _PROJECT_TYPE_LABELS.get(project_type, project_type),
                "share": round(revenue / total * 100, 1) if total > 0 else 0,
                "revenue": round(revenue / 1_000_000, 1),
                "color": _PORTFOLIO_COLORS[idx % len(_PORTFOLIO_COLORS)],
            }
        )

    return {
        "items": items,
        "period": "all",
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/trend", response_model=dict)
@cache_response(expire_seconds=600)
async def get_trend(
    period: str = Query("month"),
    db: AsyncSession = Depends(_get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Динамика выручки за 12 месяцев: сумма выигранных тендеров по месяцам."""
    months = [
        "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
        "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек",
    ]

    now = datetime.now(timezone.utc)
    year, month = now.year, now.month - 11
    if month <= 0:
        year -= 1
        month += 12
    window_start = datetime(year, month, 1, tzinfo=timezone.utc)

    result = await db.execute(
        select(Tender.our_price, Tender.nmc, Tender.created_at).where(
            and_(
                Tender.status == "won",
                Tender.created_at >= window_start,
            )
        )
    )
    revenue_by_month: dict[tuple[int, int], float] = {}
    for our_price, nmc, created_at in result.all():
        if created_at is None:
            continue
        key = (created_at.year, created_at.month)
        revenue_by_month[key] = revenue_by_month.get(key, 0.0) + (our_price or nmc or 0.0)

    points = []
    for i in range(12):
        y, m = window_start.year, window_start.month + i
        if m > 12:
            y += 1
            m -= 12
        points.append(
            {
                "label": months[m - 1],
                "value": round(revenue_by_month.get((y, m), 0.0) / 1_000_000, 1),
            }
        )

    return {
        "points": points,
        "period": period,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/finance-summary", response_model=dict)
@cache_response(expire_seconds=300)
async def get_finance_summary(
    db: AsyncSession = Depends(_get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Финансовый блок дашборда: план выручки/прибыли и средняя маржа по тендерам.

    Источник — карточки тендеров (our_price, margin_pct, nmc). Дебиторской
    задолженности источника данных нет — receivables возвращается null.
    """
    result = await db.execute(
        select(Tender.status, Tender.our_price, Tender.nmc, Tender.margin_pct)
    )
    rows = result.all()

    pipeline_statuses = {"draft", "review", "approved", "sent"}
    revenue_plan = 0.0
    profit_plan = 0.0
    revenue_won = 0.0
    margin_weighted_sum = 0.0
    margin_weight = 0.0
    for status, our_price, nmc, margin_pct in rows:
        price = our_price or nmc or 0.0
        if status in pipeline_statuses or status == "won":
            revenue_plan += price
            if margin_pct:
                profit_plan += price * margin_pct / 100
        if status == "won":
            revenue_won += price
        if margin_pct and price > 0 and status not in ("cancelled", "archived"):
            margin_weighted_sum += margin_pct * price
            margin_weight += price

    avg_margin = round(margin_weighted_sum / margin_weight, 1) if margin_weight > 0 else 0.0

    return {
        "revenue_plan_m": round(revenue_plan / 1_000_000, 1),
        "revenue_won_m": round(revenue_won / 1_000_000, 1),
        "profit_plan_m": round(profit_plan / 1_000_000, 1),
        "avg_margin_pct": avg_margin,
        "receivables_m": None,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/shipments/calendar", response_model=dict)
async def get_shipments_calendar(
    db: AsyncSession = Depends(_get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return weekly shipment calendar with status pipeline."""

    # TODO: no data source yet (no shipment tables) — returning empty
    today = datetime.now(timezone.utc).date()
    weekday = today.weekday()  # 0=Mon
    monday = today - timedelta(days=weekday)

    days = ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"]

    calendar = []
    for i in range(7):
        date = monday + timedelta(days=i)
        calendar.append({
            "day_label": days[i],
            "date": date.isoformat(),
            "is_weekend": i >= 5,
            "items": [],
        })

    pipeline = [
        {"key": "collected", "label": "Собрано", "tons": 0, "color": "amber"},
        {"key": "qc", "label": "На ОТК", "tons": 0, "color": "purple"},
        {"key": "accepted", "label": "Принято ОТК", "tons": 0, "color": "emerald"},
        {"key": "packed", "label": "Упаковано", "tons": 0, "color": "blue"},
        {"key": "shipped", "label": "Отгружено", "tons": 0, "color": "blue"},
    ]

    return {
        "week": f"{monday.isoformat()} — {(monday + timedelta(days=6)).isoformat()}",
        "days": calendar,
        "pipeline": pipeline,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/sparklines", response_model=dict)
async def get_sparklines(
    db: AsyncSession = Depends(_get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return 30-day sparkline data for trend charts."""

    now = datetime.now(timezone.utc)
    start = (now - timedelta(days=29)).replace(hour=0, minute=0, second=0, microsecond=0)

    # Workload: real daily average efficiency from time tracking sessions
    workload_result = await db.execute(
        select(
            func.date(TimeSession.started_at).label("day"),
            func.avg(TimeSession.efficiency_score).label("avg_eff"),
        )
        .where(
            and_(
                TimeSession.started_at >= start,
                TimeSession.efficiency_score.isnot(None),
            )
        )
        .group_by(func.date(TimeSession.started_at))
    )
    eff_by_day = {
        str(row.day): row.avg_eff for row in workload_result.mappings().all()
    }

    workload = []
    for i in range(30):
        day = (start + timedelta(days=i)).date().isoformat()
        eff = eff_by_day.get(day)
        workload.append(round(eff * 100, 1) if eff is not None else 0)

    # TODO: no data source yet — returning empty
    schedule_dev = [0] * 30
    # TODO: no data source yet — returning empty
    fpy = [0] * 30
    # TODO: no data source yet — returning empty
    shipments = [0] * 30

    return {
        "charts": [
            {
                "id": "schedule_dev",
                "label": "Откл графика",
                "unit": "дн",
                "current": schedule_dev[-1],
                "trend": schedule_dev,
                "status": "red" if schedule_dev[-1] > 5 else "yellow" if schedule_dev[-1] > 2 else "green",
            },
            {
                "id": "workload",
                "label": "Загруженность",
                "unit": "%",
                "current": workload[-1],
                "trend": workload,
                "status": "green" if workload[-1] >= 80 else "yellow" if workload[-1] >= 60 else "red",
            },
            {
                "id": "fpy",
                "label": "Дефектность FPY",
                "unit": "%",
                "current": fpy[-1],
                "trend": fpy,
                "status": "green" if fpy[-1] >= 95 else "yellow" if fpy[-1] >= 90 else "red",
            },
            {
                "id": "shipments",
                "label": "Отгрузки",
                "unit": "тонн/нед",
                "current": shipments[-1],
                "trend": shipments,
                "status": "green" if shipments[-1] >= 25 else "yellow" if shipments[-1] >= 15 else "red",
            },
        ],
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/alerts", response_model=dict)
async def get_alerts(
    db: AsyncSession = Depends(_get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return top auto-generated alerts with suggested actions."""

    alerts = []
    now = datetime.now(timezone.utc)

    # Alert 1: Low personnel load — real time tracking efficiency
    efficiency_result = await db.execute(
        select(func.avg(TimeSession.efficiency_score)).where(TimeSession.efficiency_score.isnot(None))
    )
    avg_eff_raw = efficiency_result.scalar()
    if avg_eff_raw is not None:
        avg_eff = avg_eff_raw * 100
        if avg_eff < 50:
            alerts.append({
                "id": "pdo_idle",
                "severity": "critical",
                "icon": "idle",
                "title": "Низкая загрузка персонала",
                "message": (
                    f"Средняя загрузка: {avg_eff:.0f}%. "
                    "Перераспределите задачи."
                ),
                "action_label": "Перераспределить",
                "action_path": "/resources",
            })

    # Alert 2: Tender deadline <48h — real deadline data
    urgent_tenders_result = await db.execute(
        select(func.count()).where(
            and_(
                Tender.deadline.isnot(None),
                Tender.deadline >= now,
                Tender.deadline < now + timedelta(hours=48),
                ~Tender.status.in_(["won", "lost", "cancelled", "archived"]),
            )
        )
    )
    urgent_tender_count = urgent_tenders_result.scalar() or 0
    if urgent_tender_count > 0:
        alerts.append({
            "id": "tender_urgent",
            "severity": "warning",
            "icon": "tender",
            "title": "Тендер: дедлайн < 48 ч",
            "message": (
                f"Срочных тендеров: {urgent_tender_count}. "
                "Требуется подача заявки."
            ),
            "action_label": "Подать заявку",
            "action_path": "/tenders",
        })

    # Alert 3: Overdue documents
    overdue_docs = await db.execute(
        select(func.count()).where(
            and_(
                Document.status != "approved",
                Document.created_at < now - timedelta(days=30),
            )
        )
    )
    overdue_count = overdue_docs.scalar() or 0
    if overdue_count > 0:
        alerts.append({
            "id": "overdue_docs",
            "severity": "critical" if overdue_count > 5 else "warning",
            "icon": "overdue",
            "title": "Просроченные документы",
            "message": f"{overdue_count} документ(ов) не согласованы более 30 дней.",
            "count": overdue_count,
            "action_label": "К документам",
            "action_path": "/documents",
        })

    # Sort: critical first, then warning
    severity_order = {"critical": 0, "warning": 1, "info": 2}
    alerts.sort(key=lambda a: severity_order.get(a["severity"], 3))

    return {
        "alerts": alerts[:3],  # Top-3
        "total": len(alerts),
        "updated_at": now.isoformat(),
    }


@router.get("/tender-pipeline", response_model=dict)
async def get_tender_pipeline(
    db: AsyncSession = Depends(_get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return tender pipeline funnel with real stage aggregates."""

    # Map funnel stages to Tender.status values
    stage_defs = [
        {"key": "preparation", "label": "Подготовка", "statuses": ["draft"]},
        {"key": "review", "label": "Изучение", "statuses": ["review"]},
        {"key": "approval", "label": "Согласование", "statuses": ["approved"]},
        {"key": "estimation", "label": "Смета", "statuses": ["approved"]},
        {"key": "submission", "label": "Подано", "statuses": ["sent"]},
        {"key": "won", "label": "Выиграно", "statuses": ["won"]},
        {"key": "lost", "label": "Проиграно", "statuses": ["lost"]},
        {"key": "cancelled", "label": "Отменено", "statuses": ["cancelled"]},
    ]

    pipeline = []
    total_max = 0
    for stage in stage_defs:
        result = await db.execute(
            select(
                func.count().label("count"),
                func.coalesce(func.sum(Tender.calculated_cost), 0).label("sum_cost"),
            ).where(Tender.status.in_(stage["statuses"]))
        )
        row = result.mappings().one()
        count = row.count or 0
        sum_cost = row.sum_cost or 0
        total_max = max(total_max, count)
        pipeline.append({
            "key": stage["key"],
            "label": stage["label"],
            "count": count,
            "sum_cost_m": round(sum_cost / 1_000_000, 1),
        })

    # Real counts for won / lost / cancelled
    won_result = await db.execute(select(func.count()).where(Tender.status == "won"))
    lost_result = await db.execute(select(func.count()).where(Tender.status == "lost"))
    cancelled_result = await db.execute(select(func.count()).where(Tender.status == "cancelled"))
    won_count = won_result.scalar() or 0
    lost_count = lost_result.scalar() or 0
    cancelled_count = cancelled_result.scalar() or 0
    win_rate = round(won_count / (won_count + lost_count) * 100, 0) if (won_count + lost_count) > 0 else 0

    # Average preparation days for sent tenders — считаем в Python (кросс-БД)
    sent_result = await db.execute(
        select(Tender.created_at).where(Tender.status == "sent")
    )
    now = datetime.now(timezone.utc)
    sent_days = []
    for (created,) in sent_result.all():
        if created is None:
            continue
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        sent_days.append((now - created).days)
    avg_prep = round(sum(sent_days) / len(sent_days), 0) if sent_days else 0

    # Overdue: deadline passed and not finalized
    overdue_result = await db.execute(
        select(func.count()).where(
            and_(
                Tender.deadline.isnot(None),
                Tender.deadline < datetime.now(timezone.utc),
                ~Tender.status.in_(["won", "lost", "cancelled", "archived"]),
            )
        )
    )
    overdue_count = overdue_result.scalar() or 0

    return {
        "stages": pipeline,
        "max_count": total_max,
        "win_rate": win_rate,
        "avg_prep_days": int(avg_prep),
        "overdue_count": overdue_count,
        "won_count": won_count,
        "lost_count": lost_count,
        "cancelled_count": cancelled_count,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/documents-by-project", response_model=dict)
@cache_response(expire_seconds=300)
async def get_documents_by_project(
    db: AsyncSession = Depends(_get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return document counts grouped by project and status."""

    # Single batch query for all project document stats
    stats_result = await db.execute(
        select(
            Document.project_id,
            func.count().label("total"),
            func.sum(case((Document.status == "draft", 1), else_=0)).label("draft"),
            func.sum(case((Document.status == "in_review", 1), else_=0)).label("in_review"),
            func.sum(case((Document.status == "approved", 1), else_=0)).label("approved"),
            func.sum(case((
                and_(
                    Document.status != "approved",
                    Document.created_at < datetime.now(timezone.utc) - timedelta(days=30),
                ),
                1,
            ), else_=0)).label("overdue"),
        ).group_by(Document.project_id)
    )
    stats_by_project = {row.project_id: row for row in stats_result.mappings().all()}
    
    projects_result = await db.execute(select(Project).where(~Project.status.in_(["archived"])))
    projects = projects_result.scalars().all()

    data = []
    for project in projects:
        row = stats_by_project.get(project.id)
        data.append({
            "project_id": project.id,
            "project_name": project.name,
            "project_code": project.code,
            "draft": row.draft if row else 0,
            "in_review": row.in_review if row else 0,
            "approved": row.approved if row else 0,
            "overdue": row.overdue if row else 0,
        })

    return {
        "projects": data,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/action-items", response_model=dict)
async def get_action_items(
    db: AsyncSession = Depends(_get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return action items requiring attention."""
    now = datetime.now(timezone.utc)
    items = []

    # 1. Overdue tasks (due_date < today, not completed)
    from app.modules.tasks.models import Task

    overdue_tasks_result = await db.execute(
        select(Task).where(
            and_(
                Task.due_date.isnot(None),
                Task.due_date < now,
                ~Task.status.in_(["cancelled", "done"]),
            )
        ).limit(10)
    )
    overdue_tasks = overdue_tasks_result.scalars().all()
    for task in overdue_tasks:
        task_due = task.due_date
        if task_due.tzinfo is None:
            task_due = task_due.replace(tzinfo=timezone.utc)
        days_overdue = max(1, (now - task_due).days)
        items.append({
            "id": f"task_{task.id}",
            "text": task.title,
            "deadline": f"Просрочено {days_overdue} дн.",
            "color": "#DC2626",
            "action": "Открыть",
            "type": "task",
        })

    # 2. Remarks without response (> 3 days old, not closed/resolved)
    from app.modules.remarks.models import Remark

    three_days_ago = now - timedelta(days=3)
    old_remarks_result = await db.execute(
        select(Remark).where(
            and_(
                Remark.status.notin_(["closed", "resolved"]),
                Remark.created_at < three_days_ago,
            )
        ).limit(10)
    )
    old_remarks = old_remarks_result.scalars().all()
    for remark in old_remarks:
        remark_created = remark.created_at
        if remark_created.tzinfo is None:
            remark_created = remark_created.replace(tzinfo=timezone.utc)
        days_old = max(1, (now - remark_created).days)
        items.append({
            "id": f"remark_{remark.id}",
            "text": remark.title,
            "deadline": f"Без ответа {days_old} дн.",
            "color": "#D4AF37",
            "action": "Ответить",
            "type": "remark",
        })

    # 3. Documents in review > 5 days
    five_days_ago = now - timedelta(days=5)
    review_docs_result = await db.execute(
        select(Document).where(
            and_(
                Document.status.in_(["in_review", "review", "pending"]),
                Document.created_at < five_days_ago,
            )
        ).limit(10)
    )
    review_docs = review_docs_result.scalars().all()
    for doc in review_docs:
        doc_created = doc.created_at
        if doc_created.tzinfo is None:
            doc_created = doc_created.replace(tzinfo=timezone.utc)
        days_old = max(1, (now - doc_created).days)
        items.append({
            "id": f"doc_{doc.id}",
            "text": f"Согласование: {doc.name}",
            "deadline": f"{days_old} дн. на согласовании",
            "color": "#2563EB",
            "action": "Перейти",
            "type": "document",
        })

    # 4. Tenders with deadline < 7 days (and not finalized)
    seven_days_future = now + timedelta(days=7)
    urgent_tenders_result = await db.execute(
        select(Tender).where(
            and_(
                Tender.deadline.isnot(None),
                Tender.deadline < seven_days_future,
                Tender.deadline >= now,
                ~Tender.status.in_(["won", "lost", "archived", "closed"]),
            )
        ).limit(10)
    )
    urgent_tenders = urgent_tenders_result.scalars().all()
    for tender in urgent_tenders:
        tender_deadline = tender.deadline
        if tender_deadline.tzinfo is None:
            tender_deadline = tender_deadline.replace(tzinfo=timezone.utc)
        days_left = max(1, (tender_deadline - now).days)
        items.append({
            "id": f"tender_{tender.id}",
            "text": tender.name,
            "deadline": f"Дедлайн через {days_left} дн.",
            "color": "#8B5CF6",
            "action": "Подать",
            "type": "tender",
        })

    return {
        "items": items[:10],
        "total": len(items),
        "updated_at": now.isoformat(),
    }


@router.get("/production-sqcdp", response_model=dict)
async def get_production_sqcdp(
    db: AsyncSession = Depends(_get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return SQCDP production metrics."""

    # TODO: no data source yet (no production tables) — returning empty
    # Only total headcount is available from the users table.
    headcount_result = await db.execute(select(func.count()).select_from(User))
    total_headcount = headcount_result.scalar() or 0

    return {
        "pillars": [
            {
                "id": "safety",
                "label": "S — Safety",
                "value": "0 инцидентов",
                "target": "цель: 0",
                "status": "green",
                "details": {
                    "last_incident": "—",
                    "days_without": 0,
                    "training_completion": "0%",
                },
            },
            {
                "id": "quality",
                "label": "Q — Quality / FPY",
                "value": "0%",
                "target": "цель: >95%",
                "status": "yellow",
                "details": {
                    "shifts": [],
                    "top_defects": [],
                    "rework_batches": 0,
                    "rework_tons": 0,
                },
            },
            {
                "id": "cost",
                "label": "C — Cost",
                "value": "0% перерасход",
                "target": "цель: <±2%",
                "status": "yellow",
                "details": {
                    "budget_m": 0,
                    "actual_m": 0,
                    "variance_pct": 0,
                    "top_overruns": [],
                },
            },
            {
                "id": "delivery",
                "label": "D — Delivery",
                "value": "0% плана выполнено",
                "target": "цель: >95%",
                "status": "yellow",
                "details": {
                    "plan_units": 0,
                    "actual_units": 0,
                    "completion_pct": 0,
                    "delay_reasons": [],
                },
            },
            {
                "id": "people",
                "label": "P — People",
                "value": "0% загрузка",
                "target": "цель: >80%",
                "status": "yellow",
                "details": {
                    "total_headcount": total_headcount,
                    "present": 0,
                    "absence_pct": 0,
                    "training_hours_avg": 0,
                },
            },
        ],
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }



@router.get("/time-tracking/team", response_model=list[TeamTimeAnalytics])
async def get_team_time_tracking(
    period: Optional[str] = Query(
        None,
        description="Aggregation period: today, week, month, quarter, year, all",
    ),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return aggregated time-tracking metrics per user for the dashboard.

    Combines session statistics with a derived quality/speed score and the
    actual gamification bonus points awarded for document approvals.
    """
    start_date = _parse_period_start(period)

    # Aggregate time sessions per user
    query = select(
        TimeSession.user_id,
        func.count(TimeSession.id).label("total_sessions"),
        func.coalesce(func.sum(TimeSession.active_time), 0).label("total_active_time"),
        func.coalesce(func.sum(TimeSession.total_duration), 0).label("total_duration"),
        func.coalesce(func.avg(TimeSession.efficiency_score), 0).label("avg_efficiency"),
        func.coalesce(func.sum(TimeSession.revisions_created), 0).label("total_revisions"),
        func.coalesce(func.sum(TimeSession.remarks_resolved), 0).label("total_remarks_resolved"),
        func.coalesce(func.sum(TimeSession.remarks_created), 0).label("total_remarks_created"),
    ).group_by(TimeSession.user_id)

    if start_date is not None:
        query = query.where(TimeSession.started_at >= start_date)

    result = await db.execute(query)
    rows = result.mappings().all()

    user_ids = [r["user_id"] for r in rows]
    users: dict[int, str] = {}
    if user_ids:
        users_result = await db.execute(
            select(User.id, User.full_name).where(User.id.in_(user_ids))
        )
        users = {uid: (full_name or "Unknown") for uid, full_name in users_result.all()}

    # Bonus points actually awarded for document approvals in the same period
    bonus_query = select(
        GamificationEvent.user_id,
        func.coalesce(func.sum(GamificationEvent.points_delta), 0).label("bonus_points"),
    ).where(GamificationEvent.event_type == "document_approved")
    if start_date is not None:
        bonus_query = bonus_query.where(GamificationEvent.created_at >= start_date)
    bonus_query = bonus_query.group_by(GamificationEvent.user_id)
    bonus_result = await db.execute(bonus_query)
    bonuses = {b["user_id"]: int(b["bonus_points"]) for b in bonus_result.mappings().all()}

    output: list[TeamTimeAnalytics] = []
    for r in rows:
        total_active_time = int(r["total_active_time"] or 0)
        total_duration = int(r["total_duration"] or 0)
        avg_efficiency = float(r["avg_efficiency"] or 0)
        # efficiency_score хранится как доля 0..1 — приводим к шкале 0..100
        if avg_efficiency <= 1.5:
            avg_efficiency *= 100
        total_revisions = int(r["total_revisions"] or 0)
        remarks_resolved = int(r["total_remarks_resolved"] or 0)
        remarks_created = int(r["total_remarks_created"] or 0)

        # Quality score: efficiency + remark resolution ratio + low revision count
        resolution_ratio = (
            min((remarks_resolved / max(remarks_created, 1)) * 100, 100)
        )
        revision_penalty = max(0, 100 - total_revisions * 10)
        quality_score = (
            0.5 * avg_efficiency
            + 0.3 * resolution_ratio
            + 0.2 * revision_penalty
        )
        quality_score = max(0.0, min(100.0, quality_score))

        # Speed score: higher active/total ratio means less idle time
        speed_score = (
            (total_active_time / max(total_duration, 1)) * 100
        )
        speed_score = max(0.0, min(100.0, speed_score))

        output.append(
            TeamTimeAnalytics(
                user_id=r["user_id"],
                full_name=users.get(r["user_id"], "Unknown"),
                total_sessions=int(r["total_sessions"] or 0),
                total_active_hours=round(total_active_time / 3600, 2),
                avg_efficiency=round(avg_efficiency, 2),
                quality_score=round(quality_score, 2),
                speed_score=round(speed_score, 2),
                bonus_points=bonuses.get(r["user_id"], 0),
            )
        )

    # Preserve stable ordering by quality score desc for predictable charts
    output.sort(key=lambda x: x.quality_score, reverse=True)
    return output


_ROLE_NAMES = {
    "admin": "Администрирование",
    "director": "Дирекция",
    "deputy_director": "Дирекция",
    "department_head": "Руководители отделов",
    "gip": "ГИПы",
    "manager": "Менеджмент",
    "engineer": "Инженерный отдел",
    "norm_controller": "Нормоконтроль",
    "site_manager": "Производство работ",
}

_TASK_NORM_PER_EMPLOYEE = 10
_OPEN_TASK_STATUSES = ("new", "in_progress", "on_hold", "review", "approval")


@router.get("/department-load", response_model=DepartmentLoadData)
async def get_department_load(
    db: AsyncSession = Depends(_get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return open-task workload grouped by user role (department)."""

    open_count = func.count(Task.id)
    result = await db.execute(
        select(User.id, User.full_name, User.role, open_count)
        .outerjoin(
            Task,
            and_(
                Task.assignee_id == User.id,
                func.lower(Task.status).in_(_OPEN_TASK_STATUSES),
            ),
        )
        .where(User.is_active.is_(True))
        .group_by(User.id, User.full_name, User.role)
        .order_by(open_count.desc())
    )
    rows = result.all()

    departments: dict[str, dict] = {}
    for user_id, full_name, role, open_tasks in rows:
        role_key = role or "other"
        dept = departments.setdefault(
            role_key,
            {
                "id": role_key,
                "name": _ROLE_NAMES.get(role_key, role_key.capitalize()),
                "current": 0,
                "employees": [],
            },
        )
        dept["current"] += open_tasks
        dept["employees"].append(
            DepartmentEmployee(
                name=full_name or f"Пользователь #{user_id}",
                role=role_key,
                current=open_tasks,
                max=_TASK_NORM_PER_EMPLOYEE,
            )
        )

    items = [
        DepartmentLoadItem(
            id=dept["id"],
            name=dept["name"],
            current=dept["current"],
            max=max(len(dept["employees"]) * _TASK_NORM_PER_EMPLOYEE, 1),
            employees=dept["employees"],
        )
        for dept in departments.values()
    ]
    return DepartmentLoadData(departments=items)
