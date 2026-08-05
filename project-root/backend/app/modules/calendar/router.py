from datetime import date, datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.auth.deps import get_current_active_user
from app.modules.auth.models import User
from app.modules.calendar.schemas import (
    BirthdayEvent,
    CalendarEventCreate,
    CalendarEventResponse,
)
from app.modules.calendar.models import CalendarEventModel
from app.modules.documents.models import Document
from app.modules.operations.models import Operation
from app.modules.projects.models import Project
from app.modules.tasks.models import Task
from app.modules.tenders.models import Tender

router = APIRouter(tags=["calendar"])

# Моковые данные дней рождений (в будущем — из модели Employee/Profile)
MOCK_BIRTHDAYS = [
    {"id": "b1", "name": "Иванов П.С.", "date": "05-15", "role": "Ведущий инженер"},
    {"id": "b2", "name": "Петрова А.М.", "date": "05-11", "role": "Инженер КЖ"},
    {"id": "b3", "name": "Сидоров В.К.", "date": "06-01", "role": "Младший инженер"},
    {"id": "b4", "name": "Новикова А.В.", "date": "12-25", "role": "Главный инженер"},
    {"id": "b5", "name": "Кузнецов Д.И.", "date": "06-15", "role": "ГИП"},
    {"id": "b6", "name": "Смирнова Е.В.", "date": "07-03", "role": "Нормоконтролёр"},
    {"id": "b7", "name": "Волков А.Н.", "date": "08-20", "role": "Менеджер проектов"},
]


def _datetime_to_date(value: datetime | None) -> date | None:
    if value is None:
        return None
    return value.date()


def _in_range(d: date, from_date: date | None, to_date: date | None) -> bool:
    if from_date is not None and d < from_date:
        return False
    if to_date is not None and d > to_date:
        return False
    return True


@router.get("/events", response_model=list[CalendarEventResponse])
async def get_calendar_events(
    from_date: Optional[date] = Query(None, description="Filter events from this date"),
    to_date: Optional[date] = Query(None, description="Filter events up to this date"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list[CalendarEventResponse]:
    """Return system-wide events plus global and user-owned calendar events."""
    events: list[CalendarEventResponse] = []

    # ─── System events: projects, tasks, tenders, operations, documents ───
    # Projects
    project_result = await db.execute(select(Project))
    for project in project_result.scalars().all():
        planned_finish = _datetime_to_date(project.planned_finish)
        if planned_finish and _in_range(planned_finish, from_date, to_date):
            events.append(
                CalendarEventResponse(
                    id=f"project-deadline-{project.id}",
                    title=f"Дедлайн проекта: {project.name}",
                    date=planned_finish,
                    type="project",
                    is_global=True,
                    is_editable=False,
                    source="system",
                    details={
                        "status": project.status,
                        "customer": project.customer_name,
                        "description": project.stage,
                        "entity_id": project.id,
                    },
                )
            )
        contract_date = _datetime_to_date(project.contract_date)
        if contract_date and _in_range(contract_date, from_date, to_date):
            events.append(
                CalendarEventResponse(
                    id=f"project-start-{project.id}",
                    title=f"Старт проекта: {project.name}",
                    date=contract_date,
                    type="project",
                    is_global=True,
                    is_editable=False,
                    source="system",
                    details={
                        "status": project.status,
                        "customer": project.customer_name,
                        "description": project.stage,
                        "entity_id": project.id,
                    },
                )
            )

    # Tasks
    task_result = await db.execute(select(Task))
    for task in task_result.scalars().all():
        due_date = _datetime_to_date(task.due_date)
        if due_date and _in_range(due_date, from_date, to_date):
            events.append(
                CalendarEventResponse(
                    id=f"task-{task.id}",
                    title=task.title,
                    date=due_date,
                    type="task",
                    is_global=True,
                    is_editable=False,
                    source="system",
                    details={
                        "status": task.status,
                        "priority": task.priority,
                        "description": task.description,
                        "entity_id": task.id,
                    },
                )
            )

    # Tenders
    tender_result = await db.execute(select(Tender))
    for tender in tender_result.scalars().all():
        tender_deadline = _datetime_to_date(tender.deadline)
        if tender_deadline and _in_range(tender_deadline, from_date, to_date):
            events.append(
                CalendarEventResponse(
                    id=f"tender-{tender.id}",
                    title=tender.name,
                    date=tender_deadline,
                    type="tender",
                    is_global=True,
                    is_editable=False,
                    source="system",
                    details={
                        "status": tender.status,
                        "customer": tender.customer_name,
                        "description": tender.project_type,
                        "entity_id": tender.id,
                    },
                )
            )

    # Operations
    operation_result = await db.execute(select(Operation))
    for operation in operation_result.scalars().all():
        op_finish = _datetime_to_date(operation.planned_finish)
        if op_finish and _in_range(op_finish, from_date, to_date):
            events.append(
                CalendarEventResponse(
                    id=f"operation-{operation.id}",
                    title=f"Операция: {operation.name}",
                    date=op_finish,
                    type="operation",
                    is_global=True,
                    is_editable=False,
                    source="system",
                    details={
                        "status": operation.status,
                        "description": operation.notes,
                        "entity_id": operation.id,
                    },
                )
            )

    # Documents
    document_result = await db.execute(select(Document))
    for document in document_result.scalars().all():
        doc_end = _datetime_to_date(document.planned_end)
        if doc_end and _in_range(doc_end, from_date, to_date):
            events.append(
                CalendarEventResponse(
                    id=f"document-{document.id}",
                    title=f"Документ: {document.name}",
                    date=doc_end,
                    type="document",
                    is_global=True,
                    is_editable=False,
                    source="system",
                    details={
                        "status": document.status,
                        "description": document.doc_type,
                        "entity_id": document.id,
                    },
                )
            )

    # ─── User-created events: global + own ───
    stmt = select(CalendarEventModel).where(
        (CalendarEventModel.is_global == True)
        | (CalendarEventModel.user_id == current_user.id)
    )
    user_result = await db.execute(stmt)
    for event in user_result.scalars().all():
        event_date = _datetime_to_date(event.date)
        if event_date and _in_range(event_date, from_date, to_date):
            events.append(
                CalendarEventResponse(
                    id=f"user-{event.id}",
                    title=event.title,
                    date=event_date,
                    type=event.type,
                    is_global=event.is_global,
                    is_editable=event.user_id == current_user.id or current_user.is_superuser,
                    source="user",
                    details={"description": event.description or ""},
                )
            )

    events.sort(key=lambda e: e.date)
    return events


@router.post("/events", response_model=CalendarEventResponse, status_code=status.HTTP_201_CREATED)
async def create_calendar_event(
    payload: CalendarEventCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> CalendarEventResponse:
    """Create a personal calendar event for the current user."""
    event = CalendarEventModel(
        title=payload.title,
        date=datetime.combine(payload.date, datetime.min.time()),
        type=payload.type or "personal",
        description=payload.description,
        is_global=False,
        user_id=current_user.id,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return CalendarEventResponse(
        id=f"user-{event.id}",
        title=event.title,
        date=payload.date,
        type=event.type,
        is_global=event.is_global,
        is_editable=True,
        source="user",
        details={"description": event.description or ""},
    )


@router.delete("/events/{event_id}")
async def delete_calendar_event(
    event_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict:
    """Delete a personal calendar event. Only owner or superuser can delete."""
    event = await db.get(CalendarEventModel, event_id)
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    if event.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
    await db.delete(event)
    await db.commit()
    return {"ok": True}


@router.get("/birthdays", response_model=list[BirthdayEvent])
async def get_calendar_birthdays(
    current_user: User = Depends(get_current_active_user),
) -> list[BirthdayEvent]:
    """Get employee birthdays for calendar display."""
    return [BirthdayEvent(**b) for b in MOCK_BIRTHDAYS]
