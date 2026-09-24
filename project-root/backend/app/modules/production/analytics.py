"""Расчёт реальных значений KPI производственного процесса.

Пустые поля KPI узлов и загрузка сотрудников заполняются на лету из
реальных модулей: учёт времени (загрузка), тендеры (воронка тендеров),
замечания (доля брака/замечаний), операции (отклонение от плана).

Значения не сохраняются в БД — они считаются при каждом запросе
GET /production/strategy, поэтому появление новых данных в системе
автоматически отражается в ответе. Если источника нет или данных
пока недостаточно, поле остаётся пустым.
"""
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.models import User
from app.modules.operations.models import Operation
from app.modules.projects.models import Project
from app.modules.remarks.models import Remark
from app.modules.tenders.models import Tender
from app.modules.time_tracking.models import TimeSession
from app.modules.production.models import ProdEmployee
from app.modules.production.schemas import StrategyResponse


# ---------- Утилиты ----------


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _month_start(now: datetime) -> datetime:
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def _workdays_elapsed(now: datetime) -> int:
    """Рабочие дни (пн–пт) от начала месяца до текущей даты включительно."""
    days = 0
    current = _month_start(now).date()
    while current <= now.date():
        if current.weekday() < 5:
            days += 1
        current = current.fromordinal(current.toordinal() + 1)
    return max(days, 1)


def _norm_name(name: str) -> str:
    return " ".join((name or "").lower().split())


# ---------- Загрузка сотрудников (time tracking) ----------


async def _user_loads(db: AsyncSession, now: datetime) -> dict[int, int]:
    """Загрузка пользователей за текущий месяц, % (0–100).

    Доля отработанного активного времени от нормы
    (рабочие дни с начала месяца × 8 часов).
    """
    start = _month_start(now)
    rows = (
        await db.execute(
            select(
                TimeSession.user_id,
                func.coalesce(func.sum(TimeSession.active_time), 0),
            )
            .where(TimeSession.started_at >= start)
            .group_by(TimeSession.user_id)
        )
    ).all()
    capacity_hours = _workdays_elapsed(now) * 8
    loads: dict[int, int] = {}
    for user_id, seconds in rows:
        hours = (seconds or 0) / 3600
        loads[user_id] = min(100, round(hours / capacity_hours * 100))
    return loads


def _match_employee_users(
    employees: list[ProdEmployee], users: list[User]
) -> dict[str, int]:
    """Сопоставление сотрудников процесса с учётными записями.

    Сначала точная связь по user_id, затем совпадение ФИО
    (полное или по фамилии с инициалами).
    """
    by_id = {u.id: u for u in users}
    by_name: dict[str, User] = {_norm_name(u.full_name or ""): u for u in users}

    matched: dict[str, int] = {}
    for emp in employees:
        if emp.user_id and emp.user_id in by_id:
            matched[emp.id] = emp.user_id
            continue
        user = by_name.get(_norm_name(emp.name))
        if user:
            matched[emp.id] = user.id
    return matched


# ---------- Источники данных для KPI узлов ----------


async def _tender_stats(db: AsyncSession, now: datetime):
    """Воронка тендеров: выиграно/проиграно и количество за месяц."""
    won = await db.scalar(
        select(func.count()).select_from(Tender).where(Tender.stage == "won")
    ) or 0
    lost = await db.scalar(
        select(func.count()).select_from(Tender).where(Tender.stage == "lost")
    ) or 0
    month_count = await db.scalar(
        select(func.count())
        .select_from(Tender)
        .where(Tender.created_at >= _month_start(now))
    ) or 0
    return won, lost, month_count


async def _remark_stats(db: AsyncSession):
    """Статистика замечаний: доля несоответствий и проекты с открытыми замечаниями."""
    total = await db.scalar(select(func.count()).select_from(Remark)) or 0
    discrepancy = (
        await db.scalar(
            select(func.count())
            .select_from(Remark)
            .where(Remark.category == "discrepancy")
        )
        or 0
    )
    open_projects = await db.scalar(
        select(func.count(func.distinct(Remark.project_id))).where(
            Remark.project_id.is_not(None),
            Remark.status.in_(["new", "in_progress"]),
        )
    ) or 0
    total_projects = await db.scalar(select(func.count()).select_from(Project)) or 0
    return total, discrepancy, open_projects, total_projects


async def _operation_deviation(db: AsyncSession) -> float | None:
    """Среднее отклонение фактического завершения операций от плана, дней."""
    rows = (
        await db.execute(
            select(Operation.planned_finish, Operation.actual_finish).where(
                Operation.planned_finish.is_not(None),
                Operation.actual_finish.is_not(None),
            )
        )
    ).all()
    deviations = [
        (actual - planned).total_seconds() / 86400
        for planned, actual in rows
        if planned and actual
    ]
    if not deviations:
        return None
    return sum(deviations) / len(deviations)


# ---------- Resolver'ы: (node_id, label) -> значение ----------


def _build_resolvers(
    now: datetime,
    emp_loads: dict[str, int],
    won: int,
    lost: int,
    month_tenders: int,
    remarks_total: int,
    remarks_discrepancy: int,
    open_remark_projects: int,
    total_projects: int,
    op_deviation: float | None,
) -> dict[tuple[str, str], str]:
    resolvers: dict[tuple[str, str], str] = {}

    if won + lost > 0:
        resolvers[("task_tender", "Выигранные тендеры")] = f"{won / (won + lost) * 100:.0f}%"
    if month_tenders > 0:
        resolvers[("task_tender", "Кол-во тендеров/мес")] = str(month_tenders)

    max_load = max(emp_loads.values()) if emp_loads else 0
    if max_load > 0:
        resolvers[("task_tz", "Загрузка инженера")] = f"{max_load}%"

    if remarks_total > 0:
        resolvers[("task_incoming", "% брака при поставке")] = (
            f"{remarks_discrepancy / remarks_total * 100:.1f}%"
        )
    if total_projects > 0:
        resolvers[("task_otk", "% изделий с замечаниями")] = (
            f"{open_remark_projects / total_projects * 100:.0f}%"
        )

    if op_deviation is not None:
        resolvers[("task_montage", "Отклонение от плана")] = f"{op_deviation:+.0f} дн."

    return resolvers


# ---------- Публичный API ----------


async def enrich_strategy(
    db: AsyncSession,
    strategy: StrategyResponse,
    employees: list[ProdEmployee],
) -> StrategyResponse:
    """Заполняет пустые значения KPI и загрузку сотрудников реальными данными."""
    now = _now()

    users = list((await db.execute(select(User))).scalars().all())

    # Загрузка сотрудников из учёта времени
    loads_by_user = await _user_loads(db, now)
    emp_user = _match_employee_users(employees, users)
    emp_loads = {
        emp_id: loads_by_user[user_id]
        for emp_id, user_id in emp_user.items()
        if user_id in loads_by_user
    }

    # KPI узлов из тендеров, замечаний, операций
    won, lost, month_tenders = await _tender_stats(db, now)
    remarks_total, remarks_discrepancy, open_projects, total_projects = (
        await _remark_stats(db)
    )
    op_deviation = await _operation_deviation(db)

    resolvers = _build_resolvers(
        now,
        emp_loads,
        won,
        lost,
        month_tenders,
        remarks_total,
        remarks_discrepancy,
        open_projects,
        total_projects,
        op_deviation,
    )

    # Сотрудники: реальная загрузка вместо сохранённого значения (>0)
    enriched_employees = []
    for resp in strategy.employees:
        load = emp_loads.get(resp.id, 0)
        enriched_employees.append(
            resp.model_copy(update={"kpi_load": load}) if load > 0 else resp
        )

    # Узлы: заполняем только пустые значения KPI
    enriched_nodes = []
    for resp in strategy.nodes:
        if not resp.kpis:
            enriched_nodes.append(resp)
            continue
        new_kpis = []
        changed = False
        for kpi in resp.kpis:
            if not kpi.value:
                value = resolvers.get((resp.id, kpi.label))
                if value:
                    kpi = kpi.model_copy(update={"value": value})
                    changed = True
            new_kpis.append(kpi)
        enriched_nodes.append(resp.model_copy(update={"kpis": new_kpis}) if changed else resp)

    return strategy.model_copy(
        update={"employees": enriched_employees, "nodes": enriched_nodes}
    )
