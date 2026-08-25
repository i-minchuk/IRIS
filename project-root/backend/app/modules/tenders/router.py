"""Tenders API router."""
import os
import uuid
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.config import settings
from app.db.session import get_db
from app.modules.auth.deps import get_current_active_user
from app.modules.auth.models import User
from app.modules.tenders.models import Tender, TenderDocumentPreview
from app.modules.tenders.schemas import (
    TenderCreate,
    TenderCreateResponse,
    TenderDetail,
    TenderDocumentPreviewCreate,
    TenderDocumentPreviewResponse,
    TenderListItem,
    TenderStageResponse,
    TenderStageUpdate,
    TenderCalculateResponse,
    TenderProjectCreateResponse,
    PortfolioSummary,
    TenderTaskItem,
    PaginatedTenderList,
    PaginationParams,
)
from app.modules.tenders.calculator import calculate_tender
from app.modules.projects.models import Project
from app.modules.tasks.models import Task
from app.core.cache import invalidate_cache

router = APIRouter(tags=["tenders"])


def _iso_or_none(dt: Optional[datetime]) -> Optional[str]:
    return dt.isoformat() if dt else None


@router.get("", response_model=PaginatedTenderList)
async def list_tenders(
    status: Optional[str] = None,
    stage: Optional[str] = None,
    pagination: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    # Build count query
    count_query = select(func.count(Tender.id))
    if status:
        count_query = count_query.where(Tender.status == status)
    if stage:
        count_query = count_query.where(Tender.stage == stage)
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Build data query with pagination
    query = select(Tender)
    if status:
        query = query.where(Tender.status == status)
    if stage:
        query = query.where(Tender.stage == stage)
    offset = (pagination.page - 1) * pagination.page_size
    query = query.order_by(Tender.created_at.desc()).offset(offset).limit(pagination.page_size)
    result = await db.execute(query)
    tenders = result.scalars().all()

    items = [
        TenderListItem(
            id=t.id,
            name=t.name,
            customer_name=t.customer_name,
            project_type=t.project_type,
            status=t.status,
            stage=t.stage,
            nmc=t.nmc,
            our_price=t.our_price,
            margin_pct=t.margin_pct,
            probability=t.probability,
            platform=t.platform,
            region=t.region,
            deadline=_iso_or_none(t.deadline),
            auction_end_time=_iso_or_none(t.auction_end_time),
            responsible_id=t.responsible_id,
            calculated_cost=t.calculated_cost,
            created_at=_iso_or_none(t.created_at),
        )
        for t in tenders
    ]

    pages = (total + pagination.page_size - 1) // pagination.page_size
    return PaginatedTenderList(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages,
    )


# ── Вложения применяемых стандартов ──────────────────────────────
# Роуты объявлены ДО /{tender_id}, чтобы «standard-attachments» не
# попадало в int-параметр.

_ALLOWED_STANDARD_EXT = {".pdf", ".doc", ".docx", ".xls", ".xlsx", ".djvu"}


def _standard_attachments_dir() -> str:
    path = os.path.join(settings.IRIS_STORAGE_ROOT, "tender_standards")
    os.makedirs(path, exist_ok=True)
    return path


@router.post("/standard-attachments")
async def upload_standard_attachment(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
):
    """Загрузить файл стандарта до создания тендера.

    Возвращает {file_name, stored_name}; stored_name передаётся при создании
    тендера в standard_files: [{standard, file_name, stored_name}].
    """
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in _ALLOWED_STANDARD_EXT:
        raise HTTPException(
            status_code=400,
            detail=f"Недопустимый тип файла {ext!r}. Разрешены: {sorted(_ALLOWED_STANDARD_EXT)}",
        )
    stored_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(_standard_attachments_dir(), stored_name)
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    return {"file_name": file.filename, "stored_name": stored_name}


@router.get("/standard-attachments/{stored_name}")
async def download_standard_attachment(
    stored_name: str,
    current_user: User = Depends(get_current_active_user),
):
    """Скачать ранее загруженный файл стандарта."""
    if not stored_name or "/" in stored_name or "\\" in stored_name or ".." in stored_name:
        raise HTTPException(status_code=400, detail="Некорректное имя файла")
    file_path = os.path.join(_standard_attachments_dir(), stored_name)
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="Файл не найден")
    return FileResponse(file_path, filename=stored_name)


@router.get("/portfolio-summary", response_model=PortfolioSummary)
async def portfolio_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Summary KPI for tender portfolio dashboard."""
    result = await db.execute(select(Tender))
    tenders = result.scalars().all()

    active_stages = {"new", "qualification", "preparation", "approval", "submitted", "auction", "waiting"}
    active = [t for t in tenders if t.stage in active_stages]
    won = [t for t in tenders if t.stage == "won"]
    lost = [t for t in tenders if t.stage == "lost"]
    auction_now = [t for t in tenders if t.stage == "auction"]

    total_nmc = sum(t.nmc or 0 for t in active)
    total_won = sum(t.our_price or t.nmc or 0 for t in won)

    submitted_count = len([t for t in tenders if t.stage in ("submitted", "auction", "waiting", "won", "lost")])
    win_rate = round(len(won) / submitted_count * 100, 1) if submitted_count else 0

    pipeline = {}
    for stage in ["new", "qualification", "preparation", "approval", "submitted", "auction", "waiting", "won", "lost", "contract"]:
        stage_tenders = [t for t in tenders if t.stage == stage]
        pipeline[stage] = {
            "count": len(stage_tenders),
            "sum_nmc": sum(t.nmc or 0 for t in stage_tenders),
        }

    return PortfolioSummary(
        active_count=len(active),
        active_sum=round(total_nmc, 2),
        won_count=len(won),
        won_sum=round(total_won, 2),
        win_rate=win_rate,
        auction_now=len(auction_now),
        pipeline=pipeline,
    )


def _parse_date(value):
    """Преобразует строку даты в datetime для SQLAlchemy / PostgreSQL."""
    if not value:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        # HTML date input: '2025-08-01' или ISO: '2025-08-01T00:00:00'
        if len(value) == 10:
            return datetime.strptime(value, "%Y-%m-%d")
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    return None


@router.post("", response_model=TenderCreateResponse)
async def create_tender(
    data: TenderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    tender = Tender(
        name=data.name,
        customer_name=data.customer_name,
        project_type=data.project_type,
        volume=data.volume,
        volume_unit=data.volume_unit,
        complexity=data.complexity,
        standards=data.standards or [],
        scope_items=data.scope_items or [],
        standard_files=data.standard_files or [],
        start_date=data.start_date,
        deadline=data.deadline,
        duration_months=data.duration_months,
        nmc=data.nmc,
        our_price=data.our_price,
        margin_pct=data.margin_pct,
        probability=data.probability,
        platform=data.platform,
        region=data.region,
        responsible_id=data.responsible_id,
        auction_end_time=data.auction_end_time,
        stage=data.stage,
        calculated_hours=data.calculated_hours,
        calculated_cost=data.calculated_cost,
        team_size=data.team_size,
        team_composition=data.team_composition or {},
        status="draft",
        created_by_id=current_user.id,
    )
    db.add(tender)
    await db.commit()
    await db.refresh(tender)
    await invalidate_cache("cache:*trend*")
    await invalidate_cache("cache:*dashboard*")
    return TenderCreateResponse(
        id=tender.id,
        name=tender.name,
        status=tender.status,
        stage=tender.stage,
        calculated_cost=tender.calculated_cost,
    )


@router.patch("/{tender_id}/stage", response_model=TenderStageResponse)
async def update_tender_stage(
    tender_id: int,
    data: TenderStageUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    # Lock the row to prevent race condition on project creation
    result = await db.execute(
        select(Tender).where(Tender.id == tender_id).with_for_update()
    )
    tender = result.scalar_one_or_none()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
    new_stage = data.stage
    new_status = data.status
    if new_stage:
        tender.stage = new_stage
    if new_status:
        tender.status = new_status
    if data.our_price is not None:
        tender.our_price = data.our_price
    if data.margin_pct is not None:
        tender.margin_pct = data.margin_pct
    if data.probability is not None:
        tender.probability = data.probability
    await db.commit()

    # Auto-create project when tender is won and no project linked yet
    project_created = None
    if new_stage == "won" and tender.project_id is None:
        today = datetime.utcnow()
        project = Project(
            name=tender.name,
            code=f"PRJ-{tender.id:04d}",
            customer_name=tender.customer_name,
            status="active",
            stage=tender.project_type,
            planned_finish=tender.deadline,
            created_by_id=current_user.id,
        )
        db.add(project)
        await db.commit()
        await db.refresh(project)
        tender.project_id = project.id
        await db.commit()
        project_created = {
            "id": project.id,
            "name": project.name,
            "code": project.code,
        }

    await invalidate_cache("cache:*trend*")
    await invalidate_cache("cache:*dashboard*")
    return TenderStageResponse(
        id=tender.id,
        stage=tender.stage,
        status=tender.status,
        project_created=project_created,
    )


@router.get("/{tender_id}", response_model=TenderDetail)
async def get_tender(
    tender_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(select(Tender).where(Tender.id == tender_id))
    tender = result.scalar_one_or_none()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
    return TenderDetail(
        id=tender.id,
        name=tender.name,
        customer_name=tender.customer_name,
        project_type=tender.project_type,
        volume=tender.volume,
        complexity=tender.complexity,
        standards=tender.standards,
        scope_items=tender.scope_items,
        standard_files=tender.standard_files,
        start_date=_iso_or_none(tender.start_date),
        deadline=_iso_or_none(tender.deadline),
        duration_months=tender.duration_months,
        nmc=tender.nmc,
        our_price=tender.our_price,
        margin_pct=tender.margin_pct,
        probability=tender.probability,
        platform=tender.platform,
        region=tender.region,
        responsible_id=tender.responsible_id,
        auction_end_time=_iso_or_none(tender.auction_end_time),
        stage=tender.stage,
        loss_reason=tender.loss_reason,
        calculated_hours=tender.calculated_hours,
        calculated_cost=tender.calculated_cost,
        team_size=tender.team_size,
        team_composition=tender.team_composition,
        status=tender.status,
        created_at=_iso_or_none(tender.created_at),
    )


@router.post("/{tender_id}/generate-preview", response_model=TenderDocumentPreviewResponse)
async def generate_preview(
    tender_id: int,
    data: TenderDocumentPreviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    preview = TenderDocumentPreview(
        tender_id=tender_id,
        doc_type=data.doc_type,
        name=data.name,
        format=data.format,
        content_data=data.content_data or {},
        preview_url=data.preview_url,
    )
    db.add(preview)
    await db.commit()
    await db.refresh(preview)
    return TenderDocumentPreviewResponse(
        id=preview.id,
        doc_type=preview.doc_type,
        name=preview.name,
    )


@router.post("/{tender_id}/calculate", response_model=TenderCalculateResponse)
async def calculate_tender_endpoint(
    tender_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Calculate workload, team and load chart for a tender."""
    result = await db.execute(select(Tender).where(Tender.id == tender_id))
    tender = result.scalar_one_or_none()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")

    calc = calculate_tender(
        project_type=tender.project_type or "KM",
        # Проектирование: объёма в м² может не быть — считаем по составу работ
        volume=tender.volume or max(len(tender.scope_items or []), 1),
        volume_unit=tender.volume_unit or "unit",
        complexity=tender.complexity or "medium",
        standards=tender.standards or [],
        duration_months=tender.duration_months,
    )

    # Update tender with calculated values
    tender.calculated_hours = calc["total_hours"]
    tender.team_size = calc["team_size"]
    tender.team_composition = calc["team_composition"]
    tender.duration_months = calc["duration_months"]
    await db.commit()

    return TenderCalculateResponse(
        tender_id=tender.id,
        name=tender.name,
        total_hours=calc["total_hours"],
        team_size=calc["team_size"],
        team_composition=calc["team_composition"],
        duration_months=calc["duration_months"],
        load_chart=calc["monthly_load"],
    )


@router.post("/{tender_id}/create-project", response_model=TenderProjectCreateResponse)
async def create_project_from_tender(
    tender_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a Project from a won/contract tender and link them."""
    result = await db.execute(select(Tender).where(Tender.id == tender_id))
    tender = result.scalar_one_or_none()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")

    if tender.project_id is not None:
        raise HTTPException(status_code=409, detail="Project already created for this tender")

    today = datetime.utcnow()
    project = Project(
        name=tender.name,
        code=f"PRJ-{tender.id:04d}",
        customer_name=tender.customer_name,
        status="active",
        stage=tender.project_type,
        planned_finish=tender.deadline,
        created_by_id=current_user.id,
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)

    tender.project_id = project.id
    await db.commit()
    await invalidate_cache("cache:*portfolio*")
    await invalidate_cache("cache:*dashboard*")

    return TenderProjectCreateResponse(
        id=project.id,
        name=project.name,
        code=project.code,
        customer_name=project.customer_name,
        status=project.status,
        stage=project.stage,
        planned_finish=project.planned_finish.isoformat() if project.planned_finish else None,
        created_at=project.created_at.isoformat() if project.created_at else None,
    )


@router.get("/{tender_id}/tasks", response_model=list[TenderTaskItem])
async def get_tender_tasks(
    tender_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get tasks linked to a tender via project_id."""
    result = await db.execute(select(Tender).where(Tender.id == tender_id))
    tender = result.scalar_one_or_none()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")

    tasks_result = await db.execute(
        select(Task).where(Task.task_data.contains({"tender_id": tender_id}))
    )
    tasks = tasks_result.scalars().all()

    return [
        TenderTaskItem(
            id=t.id,
            tender_id=tender_id,
            title=t.title,
            assignee=t.assignee.full_name if t.assignee else None,
            due_date=_iso_or_none(t.due_date),
            status=t.status,
            priority=t.priority,
        )
        for t in tasks
    ]
