"""Расчёт реальных значений KPI производственного процесса.

Пустые поля KPI узлов и загрузка сотрудников заполняются на лету из
реальных модулей: учёт времени (загрузка), тендеры (воронка тендеров),
замечания (доля брака/замечаний), операции (отклонение от плана).

Значения не сохраняются в БД — они считаются при каждом запросе
GET /production/strategy, поэтому появление новых данных в системе
автоматически отражается в ответе. Если источника нет или данных
пока недостаточно, поле остаётся пустым.

Связь сущностей с задачей процесса выполняется через process_task_id
(документы, замечания, операции). Для тендеров пока используется
глобальная статистика (тендерная модель не содержит process_task_id).
"""
from datetime import datetime, timezone

from sqlalchemy import case, func, select
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


async def _remark_stats_by_task(db: AsyncSession) -> dict[str, dict[str, int]]:
    """Статистика замечаний, сгруппированная по process_task_id.

    Возвращает для каждой задачи:
      - total: всего замечаний
      - discrepancy: замечания-категории discrepancy (брак/несоответствие)
      - open_projects: проекты с открытыми замечаниями
    """
    rows = (
        await db.execute(
            select(
                Remark.process_task_id,
                func.count().label("total"),
                func.sum(case((Remark.category == "discrepancy", 1), else_=0)).label(
                    "discrepancy"
                ),
                func.count(func.distinct(Remark.project_id)).label("open_projects"),
            )
            .where(Remark.process_task_id.is_not(None))
            .group_by(Remark.process_task_id)
        )
    ).all()

    stats: dict[str, dict[str, int]] = {}
    for task_id, total, discrepancy, open_projects in rows:
        stats[task_id] = {
            "total": total or 0,
            "discrepancy": discrepancy or 0,
            "open_projects": open_projects or 0,
        }
    return stats


async def _operation_deviation_by_task(
    db: AsyncSession,
) -> dict[str, float]:
    """Среднее отклонение фактического завершения операций от плана, дней.

    Группировка по process_task_id. Вычисление производится в Python,
    чтобы работать и с SQLite, и с PostgreSQL.
    """
    rows = (
        await db.execute(
            select(Operation.process_task_id, Operation.planned_finish, Operation.actual_finish)
            .where(
                Operation.process_task_id.is_not(None),
                Operation.planned_finish.is_not(None),
                Operation.actual_finish.is_not(None),
            )
        )
    ).all()

    grouped: dict[str, list[float]] = {}
    for task_id, planned, actual in rows:
        if not task_id or not planned or not actual:
            continue
        deviation = (actual - planned).total_seconds() / 86400
        grouped.setdefault(task_id, []).append(deviation)

    return {
        task_id: round(sum(values) / len(values), 1)
        for task_id, values in grouped.items()
        if values
    }


async def _operation_stats_by_task(
    db: AsyncSession,
) -> dict[str, dict[str, float]]:
    """Статистика операций, сгруппированная по process_task_id.

    Для каждой задачи:
      - avg_duration: средняя фактическая длительность операций, дней
      - on_time_pct: доля операций, завершённых не позже плана, %
      - count: число операций с фактическим завершением
    """
    rows = (
        await db.execute(
            select(
                Operation.process_task_id,
                Operation.actual_start,
                Operation.actual_finish,
                Operation.planned_finish,
            ).where(
                Operation.process_task_id.is_not(None),
                Operation.actual_finish.is_not(None),
            )
        )
    ).all()

    durations: dict[str, list[float]] = {}
    on_time: dict[str, list[int]] = {}
    for task_id, actual_start, actual_finish, planned_finish in rows:
        if not task_id or not actual_finish:
            continue
        if actual_start:
            duration = (actual_finish - actual_start).total_seconds() / 86400
            durations.setdefault(task_id, []).append(duration)
        if planned_finish:
            ok = 1 if actual_finish <= planned_finish else 0
            on_time.setdefault(task_id, []).append(ok)

    stats: dict[str, dict[str, float]] = {}
    for task_id in set(durations) | set(on_time):
        durs = durations.get(task_id, [])
        oks = on_time.get(task_id, [])
        entry: dict[str, float] = {"count": len(durs) or len(oks)}
        if durs:
            entry["avg_duration"] = sum(durs) / len(durs)
        if oks:
            entry["on_time_pct"] = sum(oks) / len(oks) * 100
        stats[task_id] = entry
    return stats


async def _tender_prep_avg_days(db: AsyncSession) -> float | None:
    """Средний срок подготовки тендерного предложения, дней (created_at → deadline)."""
    rows = (
        await db.execute(
            select(Tender.created_at, Tender.deadline).where(
                Tender.created_at.is_not(None),
                Tender.deadline.is_not(None),
            )
        )
    ).all()
    prep_days = [
        (deadline - created).total_seconds() / 86400
        for created, deadline in rows
        if created and deadline and deadline >= created
    ]
    if not prep_days:
        return None
    return sum(prep_days) / len(prep_days)


# ---------- Resolver'ы: (node_id, label) -> значение ----------


def _build_resolvers(
    now: datetime,
    emp_loads: dict[str, int],
    node_employee_tasks: dict[str, list[str]],
    won: int,
    lost: int,
    month_tenders: int,
    remark_stats: dict[str, dict[str, int]],
    op_deviation: dict[str, float],
    op_stats: dict[str, dict[str, float]],
    tender_prep_days: float | None,
) -> dict[tuple[str, str], str]:
    resolvers: dict[tuple[str, str], str] = {}

    # task_tender — глобальная статистика тендеров
    if won + lost > 0:
        resolvers[("task_tender", "Выигранные тендеры")] = f"{won / (won + lost) * 100:.0f}%"
    if month_tenders > 0:
        resolvers[("task_tender", "Кол-во тендеров/мес")] = str(month_tenders)
    if tender_prep_days is not None:
        resolvers[("task_tender", "Время подготовки КП")] = f"{tender_prep_days:.0f} дн."

    # task_tz — загрузка инженеров, назначенных на эту задачу
    tz_emp_ids = node_employee_tasks.get("task_tz", [])
    tz_loads = [emp_loads.get(emp_id, 0) for emp_id in tz_emp_ids]
    max_tz_load = max(tz_loads) if tz_loads else 0
    if max_tz_load > 0:
        resolvers[("task_tz", "Загрузка инженера")] = f"{max_tz_load}%"

    # task_incoming — % брака/несоответствий среди замечаний, привязанных к задаче
    incoming_stats = remark_stats.get("task_incoming", {})
    incoming_total = incoming_stats.get("total", 0)
    if incoming_total > 0:
        resolvers[("task_incoming", "% брака при поставке")] = (
            f"{incoming_stats.get('discrepancy', 0) / incoming_total * 100:.1f}%"
        )

    # task_otk — % проектов с открытыми замечаниями, привязанными к ОТК
    otk_stats = remark_stats.get("task_otk", {})
    otk_open_projects = otk_stats.get("open_projects", 0)
    otk_total = otk_stats.get("total", 0)
    if otk_total > 0:
        resolvers[("task_otk", "% изделий с замечаниями")] = (
            f"{otk_open_projects / otk_total * 100:.0f}%"
        )

    # task_montage — отклонение от плана по операциям, привязанным к задаче
    montage_dev = op_deviation.get("task_montage")
    if montage_dev is not None:
        resolvers[("task_montage", "Отклонение от плана")] = f"{montage_dev:+.0f} дн."

    # Замечания по этапам: количество ошибок/замечаний, привязанных к задаче
    def _remark_count(task_id: str, key: str = "total") -> int:
        return remark_stats.get(task_id, {}).get(key, 0)

    remark_labels: dict[tuple[str, str], tuple[str, str, str]] = {
        # (node_id, label) -> (process_task_id, поле статистики, формат)
        ("task_schema", "Ошибки в ревизии"): ("task_schema", "discrepancy", "{n} шт."),
        ("task_spec", "Точность BOM"): ("task_spec", "total", "{n} зам."),
        ("task_bom", "Число замен позиций"): ("task_bom", "total", "{n} шт."),
        ("task_wiring", "Ошибки разводки"): ("task_wiring", "discrepancy", "{n} шт."),
        ("task_wiring", "Переделки"): ("task_wiring", "total", "{n} шт."),
        ("task_shipping", "Рекламации"): ("task_shipping", "total", "{n} шт."),
    }
    for (node_id, label), (task_id, key, fmt) in remark_labels.items():
        n = _remark_count(task_id, key)
        if n > 0:
            resolvers[(node_id, label)] = fmt.format(n=n)

    # Длительность операций по этапам
    duration_labels: dict[tuple[str, str], tuple[str, str]] = {
        # (node_id, label) -> (process_task_id, формат)
        ("task_purchase", "Срок поставки (ср.)"): ("task_purchase", "{d:.0f} дн."),
        ("task_test", "Среднее время наладки"): ("task_test", "{d:.1f} дн."),
        ("task_warehouse", "Время выдачи"): ("task_warehouse", "{d:.1f} дн."),
    }
    for (node_id, label), (task_id, fmt) in duration_labels.items():
        avg_duration = op_stats.get(task_id, {}).get("avg_duration")
        if avg_duration is not None:
            resolvers[(node_id, label)] = fmt.format(d=avg_duration)

    # Своевременность завершения операций этапа
    shipping_on_time = op_stats.get("task_shipping", {}).get("on_time_pct")
    if shipping_on_time is not None:
        resolvers[("task_shipping", "Своевременность отгрузки")] = (
            f"{shipping_on_time:.0f}%"
        )

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

    # Соответствие задач -> сотрудники процесса (для расчёта загрузки по узлу)
    node_employee_tasks: dict[str, list[str]] = {}
    for emp in employees:
        for task_id in emp.tasks or []:
            node_employee_tasks.setdefault(task_id, []).append(emp.id)

    # KPI узлов из тендеров, замечаний, операций
    won, lost, month_tenders = await _tender_stats(db, now)
    remark_stats = await _remark_stats_by_task(db)
    op_deviation = await _operation_deviation_by_task(db)
    op_stats = await _operation_stats_by_task(db)
    tender_prep_days = await _tender_prep_avg_days(db)

    resolvers = _build_resolvers(
        now,
        emp_loads,
        node_employee_tasks,
        won,
        lost,
        month_tenders,
        remark_stats,
        op_deviation,
        op_stats,
        tender_prep_days,
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
