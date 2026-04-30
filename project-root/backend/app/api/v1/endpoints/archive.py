"""Archive API endpoints"""
from datetime import datetime
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.database import get_db
from app.dependencies import get_current_active_user
from app.models.user import User
from app.schemas.archive import (
    ArchiveEntryCreate, ArchiveEntryResponse, ArchiveEntryUpdate,
    ArchiveMaterialCreate, ArchiveMaterialResponse, ArchiveMaterialUpdate,
    ArchiveConstructionCreate, ArchiveConstructionResponse, ArchiveConstructionUpdate,
    ArchiveSearchQuery, ArchiveSearchResult, ArchiveFilter, ArchiveStatistics,
    ArchiveExport, TimelineResponse, TimelineEvent, SearchResultItem
)
from app.crud import archive as archive_crud
from app.models.archive import ArchiveEntryType, ArchiveConstructionStatus


router = APIRouter(prefix="/archive", tags=["Archive"])


# ==================== Entry endpoints ====================

@router.get("/entries", response_model=List[ArchiveEntryResponse])
async def list_entries(
    project_id: UUID = Query(..., description="ID проекта"),
    entry_types: List[ArchiveEntryType] = Query(None, description="Фильтр по типам"),
    date_from: Optional[datetime] = Query(None, description="Дата от"),
    date_to: Optional[datetime] = Query(None, description="Дата до"),
    is_pinned: Optional[bool] = Query(None, description="Только закрепленные"),
    has_attachments: bool = Query(False, description="Только с вложениями"),
    author_id: Optional[UUID] = Query(None, description="Автор"),
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
    project_id: UUID = Query(..., description="ID проекта"),
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
    project_id: UUID = Query(..., description="ID проекта"),
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
    project_id: UUID = Query(..., description="ID проекта"),
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
    project_id: UUID = Query(..., description="ID проекта"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Статистика по проекту"""
    stats = await archive_crud.get_statistics(db, project_id)
    return stats


@router.get("/export")
async def export_archive(
    project_id: UUID = Query(..., description="ID проекта"),
    format: str = Query(..., pattern="^(pdf|excel)$", description="Формат"),
    date_from: Optional[datetime] = Query(None, description="Дата от"),
    date_to: Optional[datetime] = Query(None, description="Дата до"),
    background_tasks: BackgroundTasks = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Экспорт архива"""
    # TODO: Реализовать генерацию PDF/Excel
    raise HTTPException(status_code=501, detail="Экспорт пока не реализован")


# ==================== Timeline ====================

@router.get("/timeline", response_model=TimelineResponse)
async def get_timeline(
    project_id: UUID = Query(..., description="ID проекта"),
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
        events.append(TimelineEvent(
            id=entry.id,
            type=entry.entry_type.value,
            title=entry.title,
            occurred_at=entry.occurred_at,
            author_name=None,  # TODO: загрузить имя автора
            data=entry.content_snapshot or {},
        ))
    
    return TimelineResponse(events=events, total=len(entries))
