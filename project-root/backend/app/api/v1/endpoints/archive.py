"""Archive API endpoints"""
from datetime import datetime
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from app.core.mode import require_full_mode
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.auth.deps import get_current_active_user
from app.modules.auth.models import User
from app.schemas.archive import (
    ArchiveEntryCreate, ArchiveEntryResponse, ArchiveEntryUpdate,
    ArchiveMaterialCreate, ArchiveMaterialResponse, ArchiveMaterialUpdate,
    ArchiveConstructionCreate, ArchiveConstructionResponse, ArchiveConstructionUpdate,
    ArchiveSearchQuery, ArchiveSearchResult, ArchiveFilter, ArchiveStatistics,
    ArchiveExport, TimelineResponse, TimelineEvent, SearchResultItem
)
from app.crud import archive as archive_crud
from app.schemas.archive import ArchiveEntryType, ArchiveConstructionStatus


router = APIRouter(tags=["Archive"])


# ==================== Entry endpoints ====================

@router.get("/entries", response_model=List[ArchiveEntryResponse])
async def list_entries(
    project_id: Optional[int] = Query(..., description="ID проекта"),
    entry_types: List[ArchiveEntryType] = Query(None, description="Фильтр по типам"),
    date_from: Optional[datetime] = Query(None, description="Дата от"),
    date_to: Optional[datetime] = Query(None, description="Дата до"),
    is_pinned: Optional[bool] = Query(None, description="Только закрепленные"),
    has_attachments: bool = Query(False, description="Только с вложениями"),
    author_id: Optional[int] = Query(None, description="Автор"),
    page: int = Query(1, ge=1, description="Страница"),
    limit: int = Query(20, ge=1, le=100, description="Лимит"),
    sort_by: str = Query("occurred_at", description="Сортировка по"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$", description="Направление"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Список архивных записей"""
    entries, total = await archive_crud.list_entries(
        db=db,
        project_id=project_id,
        entry_types=entry_types,
        date_from=date_from,
        date_to=date_to,
        is_pinned=is_pinned,
        has_attachments=has_attachments,
        author_id=author_id,
        page=page,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return entries


@router.get("/entries/{entry_id}", response_model=ArchiveEntryResponse)
async def get_entry(
    entry_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Детали архивной записи"""
    entry = await archive_crud.get_entry(db, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    return entry


@router.post("/entries", response_model=ArchiveEntryResponse)
async def create_entry(
    entry_data: ArchiveEntryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Ручное создание архивной записи (админ/РП)"""
    entry = await archive_crud.create_entry(
        db=db,
        **entry_data.model_dump(),
        author_id=current_user.id,
    )
    return entry


@router.put("/entries/{entry_id}", response_model=ArchiveEntryResponse)
async def update_entry(
    entry_id: UUID,
    update_data: ArchiveEntryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Обновление архивной записи"""
    entry = await archive_crud.get_entry(db, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    
    updated = await archive_crud.update_entry(db, entry_id, **update_data.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    return updated


@router.delete("/entries/{entry_id}")
async def delete_entry(
    entry_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Soft delete архивной записи"""
    success = await archive_crud.soft_delete_entry(db, entry_id)
    if not success:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    return {"success": True}


@router.post("/entries/{entry_id}/pin", response_model=ArchiveEntryResponse)
async def pin_entry(
    entry_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Закрепить запись"""
    entry = await archive_crud.pin_entry(db, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    return entry


@router.delete("/entries/{entry_id}/pin", response_model=ArchiveEntryResponse)
async def unpin_entry(
    entry_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Открепить запись"""
    entry = await archive_crud.unpin_entry(db, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    return entry


# ==================== Search endpoints ====================

@router.get("/search", response_model=ArchiveSearchResult)
async def search_archive(
    q: str = Query(..., min_length=1, description="Поисковый запрос"),
    project_id: Optional[int] = Query(..., description="ID проекта"),
    entry_types: List[ArchiveEntryType] = Query(None, description="Фильтр по типам"),
    date_from: Optional[datetime] = Query(None, description="Дата от"),
    date_to: Optional[datetime] = Query(None, description="Дата до"),
    limit: int = Query(20, ge=1, le=100, description="Лимит"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Полнотекстовый поиск по архиву"""
    entries, materials, constructions = await archive_crud.search(
        db=db,
        project_id=project_id,
        query_text=q,
        entry_types=entry_types,
        date_from=date_from,
        date_to=date_to,
        limit=limit,
    )
    
    # Агрегация для facets
    facets = {
        "by_type": {},
        "by_date": {},
    }
    
    for entry in entries:
        type_key = entry.entry_type.value
        facets["by_type"][type_key] = facets["by_type"].get(type_key, 0) + 1
    
    total = len(entries) + len(materials) + len(constructions)
    
    return ArchiveSearchResult(
        entries=entries,
        materials=materials,
        constructions=constructions,
        total=total,
        facets=facets,
    )


@router.get("/search/suggestions")
async def search_suggestions(
    q: str = Query(..., min_length=2, description="Запрос"),
    limit: int = Query(5, ge=1, le=10, description="Лимит"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Автодополнение поиска"""
    # Упрощенная реализация - можно улучшить с использованием pg_trgm
    suggestions = []
    return suggestions[:limit]


# ==================== Material endpoints ====================

@router.post("/materials", response_model=ArchiveMaterialResponse)
async def create_material(
    material_data: ArchiveMaterialCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Добавить материал"""
    material = await archive_crud.create_material(db, **material_data.model_dump())
    
    # Автоматическая архивация
    from app.services import archive_service
    await archive_service.archive_material_created(
        db=db,
        material_id=material.id,
        project_id=material_data.project_id,
        material_data=material_data.model_dump(),
        author_id=current_user.id,
    )
    
    return material


@router.get("/materials", response_model=List[ArchiveMaterialResponse])
async def list_materials(
    project_id: Optional[int] = Query(..., description="ID проекта"),
    material_type: Optional[ArchiveEntryType] = Query(None, description="Тип материала"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Список материалов проекта"""
    query = select(ArchiveMaterial).where(
        ArchiveMaterial.project_id == project_id
    )
    if material_type:
        query = query.where(ArchiveMaterial.material_type == material_type)
    
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/materials/{material_id}", response_model=ArchiveMaterialResponse)
async def get_material(
    material_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Детали материала"""
    material = await db.get(ArchiveMaterial, material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Материал не найден")
    return material


@router.put("/materials/{material_id}", response_model=ArchiveMaterialResponse)
async def update_material(
    material_id: UUID,
    update_data: ArchiveMaterialUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Обновить материал"""
    updated = await archive_crud.update_material(db, material_id, **update_data.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Материал не найден")
    return updated


@router.delete("/materials/{material_id}")
async def delete_material(
    material_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Удалить материал"""
    success = await archive_crud.delete_material(db, material_id)
    if not success:
        raise HTTPException(status_code=404, detail="Материал не найден")
    return {"success": True}


# ==================== Construction endpoints ====================

@router.post("/constructions", response_model=ArchiveConstructionResponse)
async def create_construction(
    construction_data: ArchiveConstructionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Добавить конструкцию"""
    construction = await archive_crud.create_construction(db, **construction_data.model_dump())
    
    # Автоматическая архивация
    from app.services import archive_service
    await archive_service.archive_construction_created(
        db=db,
        construction_id=construction.id,
        project_id=construction_data.project_id,
        construction_data=construction_data.model_dump(),
        author_id=current_user.id,
    )
    
    return construction


@router.get("/constructions", response_model=List[ArchiveConstructionResponse])
async def list_constructions(
    project_id: Optional[int] = Query(..., description="ID проекта"),
    status: Optional[ArchiveConstructionStatus] = Query(None, description="Статус"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Список конструкций проекта"""
    query = select(ArchiveConstruction).where(
        ArchiveConstruction.project_id == project_id
    )
    if status:
        query = query.where(ArchiveConstruction.status == status)
    
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/constructions/{construction_id}", response_model=ArchiveConstructionResponse)
async def get_construction(
    construction_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Детали конструкции"""
    construction = await db.get(ArchiveConstruction, construction_id)
    if not construction:
        raise HTTPException(status_code=404, detail="Конструкция не найдена")
    return construction


@router.put("/constructions/{construction_id}", response_model=ArchiveConstructionResponse)
async def update_construction(
    construction_id: UUID,
    update_data: ArchiveConstructionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Обновить конструкцию"""
    updated = await archive_crud.update_construction(db, construction_id, **update_data.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Конструкция не найдена")
    return updated


@router.delete("/constructions/{construction_id}")
async def delete_construction(
    construction_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Удалить конструкцию"""
    success = await archive_crud.delete_construction(db, construction_id)
    if not success:
        raise HTTPException(status_code=404, detail="Конструкция не найдена")
    return {"success": True}


# ==================== Statistics & Export ====================

@router.get("/statistics", response_model=ArchiveStatistics)
async def get_statistics(
    project_id: Optional[int] = Query(..., description="ID проекта"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Статистика по проекту"""
    stats = await archive_crud.get_statistics(db, project_id)
    return stats


@router.get("/export")
async def export_archive(
    project_id: Optional[int] = Query(..., description="ID проекта"),
    format: str = Query(..., pattern="^(pdf|excel)$", description="Формат"),
    date_from: Optional[datetime] = Query(None, description="Дата от"),
    date_to: Optional[datetime] = Query(None, description="Дата до"),
    background_tasks: BackgroundTasks = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    _: None = Depends(require_full_mode),
):
    """Экспорт архива"""
    if format == 'pdf':
        raise HTTPException(status_code=501, detail="PDF экспорт пока не реализован")
    
    # Excel export
    import io
    from openpyxl import Workbook
    
    entries, _ = await archive_crud.list_entries(
        db, project_id, date_from=date_from, date_to=date_to, limit=10000
    )
    
    wb = Workbook()
    ws = wb.active
    ws.title = "Архив"
    headers = ["ID", "Тип", "Название", "Описание", "Дата", "Теги"]
    ws.append(headers)
    
    for entry in entries:
        ws.append([
            str(entry.id),
            entry.entry_type.value,
            entry.title,
            entry.description or "",
            entry.occurred_at.strftime("%Y-%m-%d %H:%M") if entry.occurred_at else "",
            ", ".join(entry.tags) if entry.tags else "",
        ])
    
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    
    filename = f"archive_{project_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ==================== Timeline ====================

@router.get("/timeline", response_model=TimelineResponse)
async def get_timeline(
    project_id: Optional[int] = Query(..., description="ID проекта"),
    date_from: Optional[datetime] = Query(None, description="Дата от"),
    date_to: Optional[datetime] = Query(None, description="Дата до"),
    limit: int = Query(50, ge=1, le=200, description="Лимит"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Хронология проекта"""
    query = select(ArchiveEntry).where(
        ArchiveEntry.project_id == project_id,
        ArchiveEntry.is_deleted == False
    )
    
    if date_from:
        query = query.where(ArchiveEntry.occurred_at >= date_from)
    if date_to:
        query = query.where(ArchiveEntry.occurred_at <= date_to)
    
    query = query.order_by(ArchiveEntry.occurred_at.desc()).limit(limit)
    
    result = await db.execute(query)
    entries = result.scalars().all()
    
    events = []
    for entry in entries:
        snapshot = entry.content_snapshot or {}
        author_name = snapshot.get('author_name') or snapshot.get('author') or snapshot.get('created_by_name')
        events.append(TimelineEvent(
            id=entry.id,
            type=entry.entry_type,  # entry_type is now a string
            title=entry.title,
            occurred_at=entry.occurred_at,
            author_name=author_name,
            data=snapshot,
        ))
    
    return TimelineResponse(events=events, total=len(entries))


# ==================== Годовой архив (агрегация живых данных) ====================

from datetime import timezone


def _year_bounds(year: int):
    start = datetime(year, 1, 1, tzinfo=timezone.utc)
    end = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    return start, end


def _iso(dt) -> Optional[str]:
    return dt.isoformat() if dt else None


@router.get("/years")
async def list_archive_years(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Список годов архива с количеством проектов и тендеров."""
    from app.modules.projects.models import Project
    from app.modules.tenders.models import Tender

    years: dict = {}

    projects = (await db.execute(select(Project))).scalars().all()
    for p in projects:
        y = p.created_at.year if p.created_at else None
        if not y:
            continue
        years.setdefault(y, {"year": y, "projects_count": 0, "tenders_count": 0})
        years[y]["projects_count"] += 1

    tenders = (await db.execute(select(Tender))).scalars().all()
    for t in tenders:
        y = t.created_at.year if t.created_at else None
        if not y:
            continue
        years.setdefault(y, {"year": y, "projects_count": 0, "tenders_count": 0})
        years[y]["tenders_count"] += 1

    return sorted(years.values(), key=lambda x: x["year"], reverse=True)


def _empty_year_summary() -> dict:
    return {
        "projects_count": 0,
        "tenders_count": 0,
        "contracts_count": 0,
        "documents_count": 0,
        "remarks_count": 0,
        "purchase_requests_count": 0,
        "orders_count": 0,
        "orders_amount": 0.0,
        "workload_hours": 0.0,
    }


@router.get("/year/{year}")
async def get_year_archive(
    year: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Полный архив года: по каждому проекту — тендеры, договоры, документы,
    замечания, закупки (МТО), загрузка персонала, задачи и таймлайн событий."""
    from app.modules.projects.models import Project
    from app.modules.tenders.models import Tender
    from app.modules.srm.models import Contract, PurchaseRequest, PurchaseOrder
    from app.modules.documents.models import Document
    from app.modules.remarks.models import Remark
    from app.modules.tasks.models import Task
    from app.modules.time_tracking.models import TimeSession
    from app.modules.auth.models import User as UserModel

    start, end = _year_bounds(year)

    projects = (
        await db.execute(
            select(Project)
            .where(Project.created_at >= start, Project.created_at < end)
            .order_by(Project.created_at)
        )
    ).scalars().all()
    project_ids = [p.id for p in projects]

    if not project_ids:
        return {"year": year, "projects": [], "summary": _empty_year_summary()}

    users = (await db.execute(select(UserModel))).scalars().all()
    user_names = {u.id: (u.full_name or u.username or f"#{u.id}") for u in users}

    tenders = (
        await db.execute(select(Tender).where(Tender.project_id.in_(project_ids)))
    ).scalars().all()
    contracts = (
        await db.execute(select(Contract).where(Contract.project_id.in_(project_ids)))
    ).scalars().all()
    documents = (
        await db.execute(select(Document).where(Document.project_id.in_(project_ids)))
    ).scalars().all()
    remarks = (
        await db.execute(select(Remark).where(Remark.project_id.in_(project_ids)))
    ).scalars().all()
    requests = (
        await db.execute(
            select(PurchaseRequest).where(PurchaseRequest.project_id.in_(project_ids))
        )
    ).scalars().all()
    orders = (
        await db.execute(
            select(PurchaseOrder).where(PurchaseOrder.project_id.in_(project_ids))
        )
    ).scalars().all()
    tasks = (
        await db.execute(select(Task).where(Task.project_id.in_(project_ids)))
    ).scalars().all()
    sessions = (
        await db.execute(
            select(TimeSession).where(TimeSession.project_id.in_(project_ids))
        )
    ).scalars().all()

    def by_project(items):
        grouped: dict = {pid: [] for pid in project_ids}
        for item in items:
            pid = getattr(item, "project_id", None)
            if pid in grouped:
                grouped[pid].append(item)
        return grouped

    tenders_by = by_project(tenders)
    contracts_by = by_project(contracts)
    documents_by = by_project(documents)
    remarks_by = by_project(remarks)
    requests_by = by_project(requests)
    orders_by = by_project(orders)
    tasks_by = by_project(tasks)
    sessions_by = by_project(sessions)

    result_projects = []
    for p in projects:
        pid = p.id
        p_tenders = tenders_by[pid]
        p_contracts = contracts_by[pid]
        p_documents = documents_by[pid]
        p_remarks = remarks_by[pid]
        p_requests = requests_by[pid]
        p_orders = orders_by[pid]
        p_tasks = tasks_by[pid]
        p_sessions = sessions_by[pid]

        # Загрузка персонала: часы по сотрудникам
        workload_map: dict = {}
        for s in p_sessions:
            entry = workload_map.setdefault(
                s.user_id,
                {
                    "user_id": s.user_id,
                    "name": user_names.get(s.user_id, f"#{s.user_id}"),
                    "hours": 0.0,
                },
            )
            entry["hours"] += round((s.total_duration or 0) / 3600, 2)
        workload = sorted(workload_map.values(), key=lambda x: x["hours"], reverse=True)

        remarks_by_status: dict = {}
        for r in p_remarks:
            remarks_by_status[r.status] = remarks_by_status.get(r.status, 0) + 1

        tasks_by_status: dict = {}
        for t in p_tasks:
            key = str(t.status.value if hasattr(t.status, "value") else t.status)
            tasks_by_status[key] = tasks_by_status.get(key, 0) + 1

        # Таймлайн: ключевые события проекта «с момента тендера»
        timeline = []
        for t in p_tenders:
            timeline.append({
                "date": _iso(t.created_at), "type": "tender",
                "title": f"Тендер {t.kp_number or ''} «{t.name}» — {t.stage}",
            })
        for c in p_contracts:
            timeline.append({
                "date": _iso(c.start_date or c.created_at), "type": "contract",
                "title": f"Договор {c.number} «{c.title}» — {c.status}",
            })
        for d in p_documents:
            timeline.append({
                "date": _iso(d.created_at), "type": "document",
                "title": f"Документ {d.number} «{d.name}» — {d.status}",
            })
        for r in p_remarks:
            timeline.append({
                "date": _iso(r.created_at), "type": "remark",
                "title": f"Замечание «{r.title}» — {r.status}",
            })
        for rq in p_requests:
            timeline.append({
                "date": _iso(rq.created_at), "type": "purchase_request",
                "title": f"Заявка {rq.number or rq.id} «{rq.title}» — {rq.status}",
            })
        for o in p_orders:
            timeline.append({
                "date": _iso(o.order_date or o.created_at), "type": "order",
                "title": f"Заказ {o.number} ({o.supplier_name}) — {o.status}",
            })
        timeline.sort(key=lambda e: e["date"] or "")

        result_projects.append({
            "id": pid,
            "code": p.code,
            "name": p.name,
            "customer_name": p.customer_name,
            "status": p.status,
            "created_at": _iso(p.created_at),
            "planned_finish": _iso(p.planned_finish),
            "tenders": [
                {
                    "id": t.id, "kp_number": t.kp_number, "name": t.name,
                    "customer_name": t.customer_name, "stage": t.stage, "status": t.status,
                    "nmc": t.nmc, "our_price": t.our_price, "created_at": _iso(t.created_at),
                }
                for t in p_tenders
            ],
            "contracts": [
                {
                    "id": c.id, "number": c.number, "title": c.title,
                    "customer_name": c.supplier_name, "status": c.status,
                    "amount": float(c.amount) if c.amount is not None else None,
                    "currency": c.currency,
                    "start_date": _iso(c.start_date), "end_date": _iso(c.end_date),
                }
                for c in p_contracts
            ],
            "documents": [
                {
                    "id": d.id, "number": d.number, "name": d.name,
                    "doc_type": d.doc_type, "status": d.status, "created_at": _iso(d.created_at),
                }
                for d in p_documents
            ],
            "remarks": [
                {
                    "id": str(r.id), "title": r.title, "status": r.status,
                    "priority": r.priority, "author": user_names.get(r.author_id),
                    "created_at": _iso(r.created_at), "resolved_at": _iso(r.resolved_at),
                }
                for r in p_remarks
            ],
            "remarks_by_status": remarks_by_status,
            "purchase_requests": [
                {
                    "id": rq.id, "number": rq.number, "title": rq.title,
                    "status": rq.status, "amount": float(rq.amount) if rq.amount is not None else None,
                    "created_at": _iso(rq.created_at),
                }
                for rq in p_requests
            ],
            "orders": [
                {
                    "id": o.id, "number": o.number, "supplier_name": o.supplier_name,
                    "status": o.status, "amount": float(o.amount) if o.amount is not None else None,
                    "order_date": _iso(o.order_date), "delivery_date": _iso(o.delivery_date),
                }
                for o in p_orders
            ],
            "workload": workload,
            "tasks_total": len(p_tasks),
            "tasks_by_status": tasks_by_status,
            "timeline": timeline,
        })

    summary = {
        "projects_count": len(result_projects),
        "tenders_count": len(tenders),
        "contracts_count": len(contracts),
        "documents_count": len(documents),
        "remarks_count": len(remarks),
        "purchase_requests_count": len(requests),
        "orders_count": len(orders),
        "orders_amount": round(sum(float(o.amount or 0) for o in orders), 2),
        "workload_hours": round(sum((s.total_duration or 0) for s in sessions) / 3600, 2),
    }

    return {"year": year, "projects": result_projects, "summary": summary}
