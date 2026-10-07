"""Reports API router."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.db.session import get_db
from app.modules.auth.deps import get_current_active_user
from app.modules.auth.models import User
from app.modules.projects.models import Project
from app.modules.tasks.models import Task
from app.modules.tenders.models import Tender
from app.modules.time_tracking.models import TimeSession, EmployeeLoad
from app.modules.documents.models import Document, Revision
from app.modules.remarks.models import Remark
from app.modules.reports.schemas import ReportRequest, ReportResponse, ReportRow, ReportTemplate

router = APIRouter(tags=["reports"])


# ---------------------------------------------------------------------------
# Helper builders
# ---------------------------------------------------------------------------

def _format_datetime(value: datetime | None) -> str:
    """Format datetime as human-readable Russian string."""
    if value is None:
        return "—"
    return value.strftime("%d.%m.%Y %H:%M")


def _format_date(value: datetime | None) -> str:
    """Format date as human-readable Russian string."""
    if value is None:
        return "—"
    return value.strftime("%d.%m.%Y")


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
        "ID",
        "Название",
        "Код",
        "Заказчик",
        "Статус",
        "Этап",
        "Руководитель",
        "Дата создания",
        "Документов",
        "Задач",
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
                    "ID": project.id,
                    "Название": project.name,
                    "Код": project.code,
                    "Заказчик": project.customer_name or "—",
                    "Статус": project.status,
                    "Этап": project.stage or "—",
                    "Руководитель": project.manager_id,
                    "Дата создания": _format_datetime(project.created_at),
                    "Документов": doc_count_result.scalar() or 0,
                    "Задач": task_count_result.scalar() or 0,
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
        "ID",
        "Название",
        "Заказчик",
        "Тип объекта",
        "Этап",
        "Статус",
        "НМЦ",
        "Наша цена",
        "Маржа, %",
        "Вероятность, %",
        "Площадка",
        "Регион",
        "Дедлайн",
        "Дата создания",
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
                    "ID": t.id,
                    "Название": t.name,
                    "Заказчик": t.customer_name,
                    "Тип объекта": t.project_type,
                    "Этап": t.stage,
                    "Статус": t.status,
                    "НМЦ": t.nmc or 0,
                    "Наша цена": t.our_price or 0,
                    "Маржа, %": t.margin_pct or 0,
                    "Вероятность, %": t.probability or 0,
                    "Площадка": t.platform or "—",
                    "Регион": t.region or "—",
                    "Дедлайн": _format_datetime(t.deadline),
                    "Дата создания": _format_datetime(t.created_at),
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
        "ID пользователя",
        "Общая длительность",
        "Активное время",
        "Простой",
        "Редактирований",
        "Ревизий создано",
        "Замечаний закрыто",
        "Эффективность",
        "ID проекта",
        "Период",
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
                    "ID пользователя": s.user_id,
                    "Общая длительность": s.total_duration or 0,
                    "Активное время": s.active_time or 0,
                    "Простой": s.idle_time or 0,
                    "Редактирований": s.edit_count or 0,
                    "Ревизий создано": s.revisions_created or 0,
                    "Замечаний закрыто": s.remarks_resolved or 0,
                    "Эффективность": round(s.efficiency_score, 2) if s.efficiency_score else 0,
                    "ID проекта": s.project_id,
                    "Период": period,
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
        "Тип",
        "ID",
        "Название",
        "НМЦ",
        "Наша цена",
        "Маржа, %",
        "Расчётная стоимость",
        "Вероятность, %",
        "Ожидаемая выручка",
        "Дата создания",
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
                    "Тип": "Тендер",
                    "ID": t.id,
                    "Название": t.name,
                    "НМЦ": t.nmc or 0,
                    "Наша цена": t.our_price or 0,
                    "Маржа, %": t.margin_pct or 0,
                    "Расчётная стоимость": t.calculated_cost or 0,
                    "Вероятность, %": t.probability or 0,
                    "Ожидаемая выручка": expected,
                    "Дата создания": _format_datetime(t.created_at),
                },
            )
        )

    return ReportResponse(
        template=ReportTemplate.FINANCES.value,
        columns=columns,
        rows=rows,
        generated_at=datetime.now(timezone.utc),
    )


async def _generate_documents_report(
    db: AsyncSession,
    from_date: datetime | None,
    to_date: datetime | None,
    project_id: int | None,
    user_id: int | None,
) -> ReportResponse:
    """Generate Documents registry report (MDR/VDR style)."""
    columns = [
        "№ п/п",
        "Код документа",
        "Наименование",
        "Проект",
        "Дисциплина",
        "Тип",
        "Статус",
        "Ревизия",
        "Дата создания",
    ]

    query = select(Document).options(
        joinedload(Document.project),
    )
    if project_id is not None:
        query = query.where(Document.project_id == project_id)
    if from_date is not None:
        query = query.where(Document.created_at >= from_date)
    if to_date is not None:
        query = query.where(Document.created_at <= to_date)
    if user_id is not None:
        query = query.where(Document.author_id == user_id)

    result = await db.execute(query.order_by(Document.created_at.desc()))
    docs = result.scalars().unique().all()

    current_revision_ids = [doc.current_revision_id for doc in docs if doc.current_revision_id]
    revision_map: dict[int, Revision] = {}
    if current_revision_ids:
        rev_result = await db.execute(
            select(Revision).where(Revision.id.in_(current_revision_ids))
        )
        revision_map = {rev.id: rev for rev in rev_result.scalars().all()}

    rows: list[ReportRow] = []
    for idx, doc in enumerate(docs, start=1):
        current_revision = revision_map.get(doc.current_revision_id) if doc.current_revision_id else None
        revision_number = current_revision.number if current_revision and current_revision.number else "—"
        rows.append(
            _build_report_row(
                columns,
                {
                    "№ п/п": idx,
                    "Код документа": doc.number or "—",
                    "Наименование": doc.name or "—",
                    "Проект": doc.project.name if doc.project else "—",
                    "Дисциплина": doc.doc_type or "—",
                    "Тип": doc.doc_type or "—",
                    "Статус": doc.status or "—",
                    "Ревизия": revision_number,
                    "Дата создания": _format_datetime(doc.created_at),
                },
            )
        )

    return ReportResponse(
        template=ReportTemplate.DOCUMENTS.value,
        columns=columns,
        rows=rows,
        generated_at=datetime.now(timezone.utc),
    )


async def _generate_remarks_report(
    db: AsyncSession,
    from_date: datetime | None,
    to_date: datetime | None,
    project_id: int | None,
    user_id: int | None,
) -> ReportResponse:
    """Generate Remarks report grouped by document per project."""
    columns = [
        "№ п/п",
        "Проект",
        "Код документа",
        "Наименование документа",
        "Ревизия",
        "Дата ревизии",
        "Замечание",
        "Код замечания",
        "Автор замечания",
        "Ответ подрядчика",
        "Автор ответа",
        "Не исправлено в ревизии",
        "Статус",
    ]

    query = (
        select(Remark)
        .options(
            joinedload(Remark.document),
            joinedload(Remark.project),
            joinedload(Remark.revision),
            joinedload(Remark.author),
            joinedload(Remark.resolved_by_user),
        )
    )
    if project_id is not None:
        query = query.where(Remark.project_id == project_id)
    if user_id is not None:
        query = query.where(
            (Remark.author_id == user_id) | (Remark.assignee_id == user_id)
        )
    if from_date is not None:
        query = query.where(Remark.created_at >= from_date)
    if to_date is not None:
        query = query.where(Remark.created_at <= to_date)

    result = await db.execute(query.order_by(Remark.project_id, Remark.document_id, Remark.created_at))
    remarks = result.scalars().unique().all()

    rows: list[ReportRow] = []
    for idx, remark in enumerate(remarks, start=1):
        doc = remark.document
        project = remark.project
        revision = remark.revision
        author_name = remark.author.full_name if remark.author else "—"
        resolved_name = remark.resolved_by_user.full_name if remark.resolved_by_user else "—"
        not_fixed = "Да" if remark.status not in ("resolved", "closed") else "Нет"
        rows.append(
            _build_report_row(
                columns,
                {
                    "№ п/п": idx,
                    "Проект": project.name if project else "—",
                    "Код документа": doc.number if doc else "—",
                    "Наименование документа": doc.name if doc else "—",
                    "Ревизия": revision.number if revision else "—",
                    "Дата ревизии": _format_datetime(revision.created_at if revision else None),
                    "Замечание": remark.title or "—",
                    "Код замечания": remark.category or "—",
                    "Автор замечания": author_name,
                    "Ответ подрядчика": remark.resolution or "—",
                    "Автор ответа": resolved_name,
                    "Не исправлено в ревизии": not_fixed,
                    "Статус": remark.status or "—",
                },
            )
        )

    return ReportResponse(
        template=ReportTemplate.REMARKS.value,
        columns=columns,
        rows=rows,
        generated_at=datetime.now(timezone.utc),
    )


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

async def build_report_response(
    request: ReportRequest,
    db: AsyncSession,
) -> ReportResponse:
    """Собрать отчёт (используется эндпоинтом /generate и Celery-задачами)."""
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
    elif request.template == ReportTemplate.DOCUMENTS:
        return await _generate_documents_report(
            db, from_date, to_date, request.project_id, request.user_id
        )
    elif request.template == ReportTemplate.REMARKS:
        return await _generate_remarks_report(
            db, from_date, to_date, request.project_id, request.user_id
        )

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Unknown report template: {request.template}",
    )


@router.post("/generate", response_model=ReportResponse)
async def generate_report(
    request: ReportRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> ReportResponse:
    """Generate a report based on the requested template and filters."""
    return await build_report_response(request, db)


@router.post("/export")
async def export_report(
    request: ReportRequest,
    format: Literal["xlsx", "pdf"] = "xlsx",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Сгенерировать отчёт файлом (xlsx или pdf) и отдать на скачивание."""
    import io

    from fastapi.responses import StreamingResponse

    from app.modules.reports.exporters import report_to_pdf_bytes, report_to_xlsx_bytes

    report = await build_report_response(request, db)
    stamp = datetime.now().strftime("%Y%m%d_%H%M")
    base = f"report_{report.template}_{stamp}"

    if format == "pdf":
        payload = report_to_pdf_bytes(report)
        media_type = "application/pdf"
        filename = f"{base}.pdf"
    else:
        payload = report_to_xlsx_bytes(report)
        media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        filename = f"{base}.xlsx"

    return StreamingResponse(
        io.BytesIO(payload),
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/files/{stored_name}")
async def download_report_file(
    stored_name: str,
    current_user: User = Depends(get_current_active_user),
):
    """Отдача файлов отчётов/экспортов, сохранённых Celery-задачами в storage."""
    import os

    from fastapi.responses import FileResponse

    from app.core.config import settings

    if (
        not stored_name
        or "/" in stored_name
        or "\\" in stored_name
        or ".." in stored_name
        or "." not in stored_name
    ):
        raise HTTPException(status_code=400, detail="Некорректное имя файла")
    stem, ext = stored_name.rsplit(".", 1)
    if not stem.isalnum() or ext.lower() not in ("xlsx", "pdf", "csv", "json"):
        raise HTTPException(status_code=400, detail="Некорректное имя файла")

    for subdir in ("reports", "exports"):
        file_path = os.path.join(settings.IRIS_STORAGE_ROOT, subdir, stored_name)
        if os.path.isfile(file_path):
            return FileResponse(file_path, filename=stored_name)
    raise HTTPException(status_code=404, detail="Файл не найден")
