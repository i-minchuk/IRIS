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
from app.modules.tenders.models import Tender
import hashlib

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


@router.get("/kpi", response_model=dict)
async def get_kpi_tiles(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return 6 KPI tiles for the executive dashboard."""

    # --- Tile 1: Personnel Load ---
    # Use time tracking efficiency as proxy
    efficiency_result = await db.execute(
        select(func.avg(TimeSession.efficiency_score)).where(TimeSession.efficiency_score.isnot(None))
    )
    avg_efficiency = efficiency_result.scalar() or 0.75
    personnel_load = round(avg_efficiency * 100, 0)

    # Mock departmental breakdown
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

    overdue_tenders = 0  # Mock: no deadline field easily queryable
    tender_status = "green" if overdue_tenders < 3 else "yellow" if overdue_tenders <= 5 else "red"

    # --- Tile 4: Overdue Documents ---
    # Documents not approved and older than 30 days
    overdue_docs_result = await db.execute(
        select(func.count()).where(
            and_(
                Document.status != "approved",
                Document.created_at < datetime.utcnow() - timedelta(days=30),
            )
        )
    )
    overdue_docs = overdue_docs_result.scalar() or 0
    doc_status = "red" if overdue_docs > 0 else "green"

    # --- Tile 5: FPY OTK (Mock) ---
    fpy = 91.2
    fpy_status = "green" if fpy > 95 else "yellow" if fpy >= 90 else "red"

    # --- Tile 6: Shipments Week (Mock) ---
    shipments_done = 3
    shipments_plan = 5
    ship_pct = (shipments_done / shipments_plan * 100) if shipments_plan > 0 else 0
    ship_status = "green" if ship_pct >= 80 else "yellow" if ship_pct >= 50 else "red"

    return {
        "tiles": [
            {
                "id": "personnel_load",
                "label": "Загруженность персонала",
                "value": f"{int(personnel_load)}%",
                "trend": "▼ -3%",
                "trend_direction": "down",
                "status": personnel_status,
                "subtext": "ПДО: 92% | Произв: 71% | ОТК: 85% | Тендер: 70%",
            },
            {
                "id": "projects_work",
                "label": "Проектов в работе",
                "value": str(total_work),
                "trend": "▲ +2",
                "trend_direction": "up",
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
                "subtext": f"На подготовке: {max(0, active_tenders - 5)} | Подано: 5 | Просрочено: {overdue_tenders}",
            },
            {
                "id": "overdue_docs",
                "label": "Просроченных документов",
                "value": str(overdue_docs),
                "trend": "▼ -2",
                "trend_direction": "down",
                "status": doc_status,
                "subtext": "ПДО: 3 | ОТК: 2 | Тендер: 2",
                "clickable": True,
            },
            {
                "id": "fpy_otk",
                "label": "FPY ОТК (первый проход)",
                "value": f"{fpy}%",
                "trend": "▼ -1.8%",
                "trend_direction": "down",
                "status": fpy_status,
                "subtext": "Цель: >95% | Брак: 8.8% | Повторная приёмка: 3",
            },
            {
                "id": "shipments_week",
                "label": "Отгрузок неделя",
                "value": f"{shipments_done}/{shipments_plan}",
                "trend": "▲ +1",
                "trend_direction": "up",
                "status": ship_status,
                "subtext": "Готово: 3 | В пути: 1 | Задержка: 1",
            },
        ]
    }


def _hash_seed(project_id: int, field: str) -> float:
    """Deterministic pseudo-random 0..1 from project id + field name."""
    h = hashlib.md5(f"{project_id}:{field}".encode()).hexdigest()
    return int(h, 16) / (2 ** 128)


@router.get("/portfolio", response_model=dict)
async def get_portfolio(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return project portfolio bubble-chart data (budget% vs schedule%)."""

    projects_result = await db.execute(
        select(Project).where(~Project.status.in_(["archived"]))
    )
    projects = projects_result.scalars().all()

    bubbles = []
    for p in projects:
        # Deterministic mock values based on project id
        budget_pct = round(70 + _hash_seed(p.id, "budget") * 80, 1)      # 70..150
        schedule_pct = round(60 + _hash_seed(p.id, "schedule") * 90, 1)  # 60..150
        total_budget = round(2 + _hash_seed(p.id, "value") * 48, 2)      # 2..50 млн

        # Zone classification
        if budget_pct > 100 and schedule_pct > 100:
            zone = "crisis"
            zone_label = "🔥 Кризис"
        elif budget_pct > 100:
            zone = "budget"
            zone_label = "⚠️ Проблемы бюджета"
        elif schedule_pct > 100:
            zone = "recoverable"
            zone_label = "📈 Восстановимые"
        else:
            zone = "stars"
            zone_label = "⭐ Звёзды"

        bubbles.append({
            "id": p.id,
            "name": p.name,
            "code": p.code,
            "budget_pct": budget_pct,
            "schedule_pct": schedule_pct,
            "total_budget_m": total_budget,
            "zone": zone,
            "zone_label": zone_label,
            "status": p.status,
        })

    # Also return zone counts for legend
    zone_counts = {"stars": 0, "budget": 0, "recoverable": 0, "crisis": 0}
    for b in bubbles:
        zone_counts[b["zone"]] = zone_counts.get(b["zone"], 0) + 1

    return {
        "projects": bubbles,
        "zones": zone_counts,
        "updated_at": datetime.utcnow().isoformat(),
    }


@router.get("/shipments/calendar", response_model=dict)
async def get_shipments_calendar(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return weekly shipment calendar with status pipeline."""

    # Mock shipment data — no shipment tables yet
    today = datetime.utcnow().date()
    weekday = today.weekday()  # 0=Mon
    monday = today - timedelta(days=weekday)

    days = ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"]
    mock_items = [
        [{"name": "Газопровод", "tons": 15, "status": "accepted"}, {"name": "НПЗ", "tons": 8, "status": "packed"}],
        [{"name": "ТЭЦ", "tons": 12, "status": "qc"}],
        [{"name": "ЖК", "tons": 5, "status": "accepted"}],
        [{"name": "Мост Волга", "tons": 22, "status": "collected"}, {"name": "АЗС", "tons": 3, "status": "packed"}],
        [{"name": "Котельная", "tons": 7, "status": "collected"}],
        [],
        [],
    ]

    calendar = []
    for i in range(7):
        date = monday + timedelta(days=i)
        calendar.append({
            "day_label": days[i],
            "date": date.isoformat(),
            "is_weekend": i >= 5,
            "items": mock_items[i],
        })

    pipeline = [
        {"key": "collected", "label": "Собрано", "tons": 45, "color": "amber"},
        {"key": "qc", "label": "На ОТК", "tons": 12, "color": "purple"},
        {"key": "accepted", "label": "Принято ОТК", "tons": 38, "color": "emerald"},
        {"key": "packed", "label": "Упаковано", "tons": 30, "color": "blue"},
        {"key": "shipped", "label": "Отгружено", "tons": 25, "color": "blue"},
    ]

    return {
        "week": f"{monday.isoformat()} — {(monday + timedelta(days=6)).isoformat()}",
        "days": calendar,
        "pipeline": pipeline,
        "updated_at": datetime.utcnow().isoformat(),
    }


@router.get("/sparklines", response_model=dict)
async def get_sparklines(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return 30-day sparkline data for trend charts."""

    import random
    random.seed(42)

    def make_series(base: float, variance: float, count: int = 30):
        vals = []
        cur = base
        for _ in range(count):
            cur += random.uniform(-variance, variance)
            cur = max(0, round(cur, 1))
            vals.append(cur)
        return vals

    schedule_dev = make_series(3.5, 1.2)
    workload = make_series(75, 8)
    fpy = make_series(91, 2)
    shipments = make_series(30, 6)

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
        "updated_at": datetime.utcnow().isoformat(),
    }


@router.get("/alerts", response_model=dict)
async def get_alerts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return top auto-generated alerts with suggested actions."""

    alerts = []

    # Alert 1: PDO idle — check avg efficiency from time tracking
    efficiency_result = await db.execute(
        select(func.avg(TimeSession.efficiency_score)).where(TimeSession.efficiency_score.isnot(None))
    )
    avg_eff = (efficiency_result.scalar() or 0.75) * 100
    if avg_eff < 50:
        alerts.append({
            "id": "pdo_idle",
            "severity": "critical",
            "icon": "idle",
            "title": "ПДО простаивает 3 дня",
            "message": f"Средняя загрузка отдела ПДО: {avg_eff:.0f}%. Срочно перераспределите задачи.",
            "action_label": "Перераспределить",
            "action_path": "/resources",
        })

    # Alert 2: QC FPY drop — mock threshold
    fpy = 91.2
    if fpy < 95:
        alerts.append({
            "id": "qc_fpy_drop",
            "severity": "warning" if fpy >= 90 else "critical",
            "icon": "qc",
            "title": "FPY ОТК ниже цели",
            "message": f"Первый проход ОТК: {fpy}% (цель >95%). Брак вырос до {100-fpy:.1f}%.",
            "action_label": "Открыть протокол",
            "action_path": "/remarks",
        })

    # Alert 3: Tender deadline <48h — mock (no deadline field yet)
    active_tenders = await db.execute(
        select(func.count()).where(~Tender.status.in_(["closed", "archived", "lost", "won"]))
    )
    active_tender_count = active_tenders.scalar() or 0
    if active_tender_count > 0:
        # Mock: pretend 1 tender is urgent
        alerts.append({
            "id": "tender_urgent",
            "severity": "warning",
            "icon": "tender",
            "title": "Тендер: дедлайн < 48 ч",
            "message": f"Активных тендеров: {active_tender_count}. 1 заявка требует срочной подачи.",
            "action_label": "Подать заявку",
            "action_path": "/tenders",
        })

    # Alert 4: Overdue documents
    overdue_docs = await db.execute(
        select(func.count()).where(
            and_(
                Document.status != "approved",
                Document.created_at < datetime.utcnow() - timedelta(days=30),
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
            "action_label": "К документам",
            "action_path": "/documents",
        })

    # Sort: critical first, then warning
    severity_order = {"critical": 0, "warning": 1, "info": 2}
    alerts.sort(key=lambda a: severity_order.get(a["severity"], 3))

    return {
        "alerts": alerts[:3],  # Top-3
        "total": len(alerts),
        "updated_at": datetime.utcnow().isoformat(),
    }


@router.get("/tender-pipeline", response_model=dict)
async def get_tender_pipeline(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return tender pipeline funnel with stage aggregates."""

    stages = [
        {"key": "analysis", "label": "Анализ и подготовка", "statuses": ["draft"]},
        {"key": "documentation", "label": "Документация КД", "statuses": ["review"]},
        {"key": "pricing", "label": "Ценообразование", "statuses": ["approved"]},
        {"key": "sent", "label": "Подано", "statuses": ["sent"]},
        {"key": "review", "label": "На рассмотрении", "statuses": ["won", "lost"]},
    ]

    pipeline = []
    total_max = 0
    for stage in stages:
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

    # Win rate: won / (won + lost)
    won_result = await db.execute(select(func.count()).where(Tender.status == "won"))
    lost_result = await db.execute(select(func.count()).where(Tender.status == "lost"))
    won_count = won_result.scalar() or 0
    lost_count = lost_result.scalar() or 0
    win_rate = round(won_count / (won_count + lost_count) * 100, 0) if (won_count + lost_count) > 0 else 0

    # Average preparation days (mock: created_at to now for sent tenders)
    sent_result = await db.execute(
        select(func.avg(func.julianday("now") - func.julianday(Tender.created_at)))
        .where(Tender.status == "sent")
    )
    avg_prep = round(sent_result.scalar() or 14, 0)

    # Overdue: deadline passed and not finalized
    overdue_result = await db.execute(
        select(func.count()).where(
            and_(
                Tender.deadline.isnot(None),
                Tender.deadline < datetime.utcnow(),
                ~Tender.status.in_(["won", "lost", "archived"]),
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
        "updated_at": datetime.utcnow().isoformat(),
    }


@router.get("/documents-by-project", response_model=dict)
async def get_documents_by_project(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return document counts grouped by project and status."""

    projects_result = await db.execute(select(Project).where(~Project.status.in_(["archived"])))
    projects = projects_result.scalars().all()

    data = []
    for project in projects:
        doc_stats = await db.execute(
            select(
                func.count().label("total"),
                func.sum(case((Document.status == "draft", 1), else_=0)).label("draft"),
                func.sum(case((Document.status == "in_review", 1), else_=0)).label("in_review"),
                func.sum(case((Document.status == "approved", 1), else_=0)).label("approved"),
            ).where(Document.project_id == project.id)
        )
        row = doc_stats.mappings().one()

        overdue_stats = await db.execute(
            select(func.count()).where(
                and_(
                    Document.project_id == project.id,
                    Document.status != "approved",
                    Document.created_at < datetime.utcnow() - timedelta(days=30),
                )
            )
        )
        overdue = overdue_stats.scalar() or 0

        data.append({
            "project_id": project.id,
            "project_name": project.name,
            "project_code": project.code,
            "draft": row.draft or 0,
            "in_review": row.in_review or 0,
            "approved": row.approved or 0,
            "overdue": overdue,
        })

    return {
        "projects": data,
        "updated_at": datetime.utcnow().isoformat(),
    }


@router.get("/production-sqcdp", response_model=dict)
async def get_production_sqcdp(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return SQCDP production metrics."""

    # All mock data — no production tables yet
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
                    "days_without": 142,
                    "training_completion": "98%",
                },
            },
            {
                "id": "quality",
                "label": "Q — Quality / FPY",
                "value": "91.2%",
                "target": "цель: >95%",
                "status": "yellow",
                "details": {
                    "shifts": [
                        {"name": "Смена А", "fpy": 94},
                        {"name": "Смена Б", "fpy": 85},
                        {"name": "Смена В", "fpy": 93},
                    ],
                    "top_defects": [
                        {"name": "Сварной шов", "pct": 45},
                        {"name": "Геометрия", "pct": 30},
                        {"name": "Покрытие", "pct": 25},
                    ],
                    "rework_batches": 3,
                    "rework_tons": 12,
                },
            },
            {
                "id": "cost",
                "label": "C — Cost",
                "value": "+3.2% перерасход",
                "target": "цель: <±2%",
                "status": "red",
                "details": {
                    "budget_m": 28.5,
                    "actual_m": 29.4,
                    "variance_pct": 3.2,
                    "top_overruns": [
                        {"name": "Материалы", "pct": 4.1},
                        {"name": "Субподряд", "pct": 2.8},
                    ],
                },
            },
            {
                "id": "delivery",
                "label": "D — Delivery",
                "value": "87% плана выполнено",
                "target": "цель: >95%",
                "status": "yellow",
                "details": {
                    "plan_units": 120,
                    "actual_units": 104,
                    "completion_pct": 87,
                    "delay_reasons": [
                        {"name": "Поставка материалов", "count": 3},
                        {"name": "Неквалифицированный персонал", "count": 2},
                    ],
                },
            },
            {
                "id": "people",
                "label": "P — People",
                "value": "71% загрузка",
                "target": "цель: >80%",
                "status": "yellow",
                "details": {
                    "total_headcount": 42,
                    "present": 38,
                    "absence_pct": 9.5,
                    "training_hours_avg": 4.2,
                },
            },
        ],
        "updated_at": datetime.utcnow().isoformat(),
    }
