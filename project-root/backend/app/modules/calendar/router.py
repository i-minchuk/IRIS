from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.auth.deps import get_current_active_user
from app.modules.auth.models import User
from app.modules.calendar.schemas import CalendarEvent
from app.modules.projects.models import Project
from app.modules.tasks.models import Task
from app.modules.tenders.models import Tender

router = APIRouter(tags=["calendar"])


def _datetime_to_date(value: datetime | None) -> date | None:
    if value is None:
        return None
    return value.date()


@router.get("/events", response_model=list[CalendarEvent])
async def get_calendar_events(
    from_date: Optional[date] = Query(None, description="Filter events from this date"),
    to_date: Optional[date] = Query(None, description="Filter events up to this date"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list[CalendarEvent]:
    """Collect calendar events from projects, tasks and tenders."""
    events: list[CalendarEvent] = []

    # --- Projects: deadline (planned_finish) and start_date (contract_date) ---
    project_result = await db.execute(select(Project))
    projects = project_result.scalars().all()

    for project in projects:
        # Event: planned_finish as deadline
        planned_finish = _datetime_to_date(project.planned_finish)
        if planned_finish is not None:
            if (from_date is None or planned_finish >= from_date) and (
                to_date is None or planned_finish <= to_date
            ):
                events.append(
                    CalendarEvent(
                        id=f"project-deadline-{project.id}",
                        title=f"Дедлайн проекта: {project.name}",
                        date=planned_finish,
                        type="project",
                        status=project.status,
                        priority=None,
                        customer=project.customer_name,
                        description=project.stage,
                        entity_id=project.id,
                    )
                )

        # Event: contract_date as start_date
        contract_date = _datetime_to_date(project.contract_date)
        if contract_date is not None:
            if (from_date is None or contract_date >= from_date) and (
                to_date is None or contract_date <= to_date
            ):
                events.append(
                    CalendarEvent(
                        id=f"project-start-{project.id}",
                        title=f"Старт проекта: {project.name}",
                        date=contract_date,
                        type="project",
                        status=project.status,
                        priority=None,
                        customer=project.customer_name,
                        description=project.stage,
                        entity_id=project.id,
                    )
                )

    # --- Tasks: due_date ---
    task_result = await db.execute(select(Task))
    tasks = task_result.scalars().all()

    for task in tasks:
        due_date = _datetime_to_date(task.due_date)
        if due_date is not None:
            if (from_date is None or due_date >= from_date) and (
                to_date is None or due_date <= to_date
            ):
                events.append(
                    CalendarEvent(
                        id=f"task-{task.id}",
                        title=task.title,
                        date=due_date,
                        type="task",
                        status=task.status,
                        priority=task.priority,
                        customer=None,
                        description=task.description,
                        entity_id=task.id,
                    )
                )

    # --- Tenders: deadline ---
    tender_result = await db.execute(select(Tender))
    tenders = tender_result.scalars().all()

    for tender in tenders:
        tender_deadline = _datetime_to_date(tender.deadline)
        if tender_deadline is not None:
            if (from_date is None or tender_deadline >= from_date) and (
                to_date is None or tender_deadline <= to_date
            ):
                events.append(
                    CalendarEvent(
                        id=f"tender-{tender.id}",
                        title=tender.name,
                        date=tender_deadline,
                        type="tender",
                        status=tender.status,
                        priority=None,
                        customer=tender.customer_name,
                        description=tender.project_type,
                        entity_id=tender.id,
                    )
                )

    # Sort by date
    events.sort(key=lambda e: e.date)
    return events
