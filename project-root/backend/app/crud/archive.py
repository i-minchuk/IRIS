"""CRUD operations for Archive"""
from datetime import datetime
from typing import Optional, List, Tuple
from uuid import UUID
from sqlalchemy import select, func, text, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.dialects.postgresql import to_tsvector, ts_rank_cd, plainto_tsquery

from app.models.archive import (
    ArchiveEntry, ArchiveMaterial, ArchiveConstruction,
    ArchiveEntryType, ArchiveMaterialType, ArchiveConstructionType,
    ArchiveConstructionStatus
)
from app.models.project import Project
from app.models.user import User


async def create_entry(
    db: AsyncSession,
    project_id: UUID,
    entry_type: ArchiveEntryType,
    source_table: str,
    source_id: UUID,
    title: str,
    description: Optional[str] = None,
    content_snapshot: Optional[dict] = None,
    author_id: Optional[UUID] = None,
    occurred_at: Optional[datetime] = None,
    tags: List[str] = None,
    attachments: List[dict] = None,
    related_entry_ids: List[UUID] = None,
    is_pinned: bool = False,
) -> ArchiveEntry:
    """Создание архивной записи"""
    entry = ArchiveEntry(
        project_id=project_id,
        entry_type=entry_type,
        source_table=source_table,
        source_id=source_id,
        title=title,
        description=description,
        content_snapshot=content_snapshot,
        author_id=author_id,
        occurred_at=occurred_at or datetime.utcnow(),
        tags=tags or [],
        attachments=attachments or [],
        related_entry_ids=related_entry_ids or [],
        is_pinned=is_pinned,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


async def get_entry(db: AsyncSession, entry_id: UUID) -> Optional[ArchiveEntry]:
    """Получение записи по ID"""
    result = await db.execute(
        select(ArchiveEntry)
        .options(
            selectinload(ArchiveEntry.author),
            selectinload(ArchiveEntry.materials),
            selectinload(ArchiveEntry.constructions)
        )
        .where(ArchiveEntry.id == entry_id)
        .where(ArchiveEntry.is_deleted == False)
    )
    return result.scalar_one_or_none()


async def list_entries(
    db: AsyncSession,
    project_id: UUID,
    entry_types: List[ArchiveEntryType] = None,
    date_from: datetime = None,
    date_to: datetime = None,
    is_pinned: bool = None,
    has_attachments: bool = False,
    author_id: UUID = None,
    page: int = 1,
    limit: int = 20,
    sort_by: str = "occurred_at",
    sort_order: str = "desc",
) -> Tuple[List[ArchiveEntry], int]:
    """Список записей с фильтрацией"""
    query = select(ArchiveEntry).where(
        ArchiveEntry.project_id == project_id,
        ArchiveEntry.is_deleted == False
    )

    if entry_types:
        query = query.where(ArchiveEntry.entry_type.in_(entry_types))
    if date_from:
        query = query.where(ArchiveEntry.occurred_at >= date_from)
    if date_to:
        query = query.where(ArchiveEntry.occurred_at <= date_to)
    if is_pinned is not None:
        query = query.where(ArchiveEntry.is_pinned == is_pinned)
    if has_attachments:
        query = query.where(func.jsonb_array_length(ArchiveEntry.attachments) > 0)
    if author_id:
        query = query.where(ArchiveEntry.author_id == author_id)

    # Сортировка
    sort_column = getattr(ArchiveEntry, sort_by, ArchiveEntry.occurred_at)
    if sort_order == "desc":
        sort_column = sort_column.desc()
    else:
        sort_column = sort_column.asc()
    query = query.order_by(
        ArchiveEntry.is_pinned.desc(),
        sort_column
    )

    # Пагинация
    offset = (page - 1) * limit
    total_result = await db.execute(
        select(func.count()).select_from(query.subquery())
    )
    total = total_result.scalar()

    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    entries = result.scalars().all()

    return entries, total


async def search(
    db: AsyncSession,
    project_id: UUID,
    query_text: str,
    entry_types: List[ArchiveEntryType] = None,
    date_from: datetime = None,
    date_to: datetime = None,
    limit: int = 20,
) -> Tuple[List[ArchiveEntry], List[ArchiveMaterial], List[ArchiveConstruction]]:
    """Полнотекстовый поиск по архиву"""
    # Поиск по entry
    search_query = plainto_tsquery('russian', query_text)
    
    entries_query = (
        select(ArchiveEntry)
        .where(ArchiveEntry.project_id == project_id)
        .where(ArchiveEntry.is_deleted == False)
        .where(ArchiveEntry.search_vector.op("@@")(search_query))
    )

    if entry_types:
        entries_query = entries_query.where(ArchiveEntry.entry_type.in_(entry_types))
    if date_from:
        entries_query = entries_query.where(ArchiveEntry.occurred_at >= date_from)
    if date_to:
        entries_query = entries_query.where(ArchiveEntry.occurred_at <= date_to)

    # Ранжирование
    rank = ts_rank_cd(ArchiveEntry.search_vector, search_query)
    entries_query = entries_query.order_by(rank.desc()).limit(limit)

    entries_result = await db.execute(entries_query)
    entries = entries_result.scalars().all()

    # Поиск по материалам
    materials_query = (
        select(ArchiveMaterial)
        .where(ArchiveMaterial.project_id == project_id)
        .where(
            or_(
                ArchiveMaterial.name.ilike(f"%{query_text}%"),
                ArchiveMaterial.specification.ilike(f"%{query_text}%"),
                ArchiveMaterial.manufacturer.ilike(f"%{query_text}%"),
            )
        )
        .limit(limit)
    )
    materials_result = await db.execute(materials_query)
    materials = materials_result.scalars().all()

    # Поиск по конструкциям
    constructions_query = (
        select(ArchiveConstruction)
        .where(ArchiveConstruction.project_id == project_id)
        .where(
            or_(
                ArchiveConstruction.name.ilike(f"%{query_text}%"),
                ArchiveConstruction.designation.ilike(f"%{query_text}%"),
                ArchiveConstruction.location.ilike(f"%{query_text}%"),
            )
        )
        .limit(limit)
    )
    constructions_result = await db.execute(constructions_query)
    constructions = constructions_result.scalars().all()

    return entries, materials, constructions


async def create_material(
    db: AsyncSession,
    project_id: UUID,
    material_type: ArchiveMaterialType,
    name: str,
    specification: Optional[str] = None,
    manufacturer: Optional[str] = None,
    quantity: Optional[float] = None,
    unit: Optional[str] = None,
    used_in_constructions: List[UUID] = None,
    certificates: List[dict] = None,
    attached_files: List[dict] = None,
    entry_id: Optional[UUID] = None,
) -> ArchiveMaterial:
    """Создание материала"""
    material = ArchiveMaterial(
        project_id=project_id,
        material_type=material_type,
        name=name,
        specification=specification,
        manufacturer=manufacturer,
        quantity=quantity,
        unit=unit,
        used_in_constructions=used_in_constructions or [],
        certificates=certificates or [],
        attached_files=attached_files or [],
        entry_id=entry_id,
    )
    db.add(material)
    await db.commit()
    await db.refresh(material)
    return material


async def update_material(
    db: AsyncSession,
    material_id: UUID,
    **kwargs,
) -> Optional[ArchiveMaterial]:
    """Обновление материала"""
    material = await db.get(ArchiveMaterial, material_id)
    if not material:
        return None

    for key, value in kwargs.items():
        if hasattr(material, key):
            setattr(material, key, value)

    await db.commit()
    await db.refresh(material)
    return material


async def delete_material(db: AsyncSession, material_id: UUID) -> bool:
    """Удаление материала"""
    material = await db.get(ArchiveMaterial, material_id)
    if not material:
        return False

    await db.delete(material)
    await db.commit()
    return True


async def create_construction(
    db: AsyncSession,
    project_id: UUID,
    name: str,
    construction_type: ArchiveConstructionType,
    designation: Optional[str] = None,
    location: Optional[str] = None,
    materials_used: List[UUID] = None,
    documents_related: List[UUID] = None,
    status: ArchiveConstructionStatus = ArchiveConstructionStatus.PLANNED,
    installed_at: datetime = None,
    tested_at: datetime = None,
    accepted_at: datetime = None,
    photos: List[dict] = None,
    entry_id: Optional[UUID] = None,
) -> ArchiveConstruction:
    """Создание конструкции"""
    construction = ArchiveConstruction(
        project_id=project_id,
        name=name,
        construction_type=construction_type,
        designation=designation,
        location=location,
        materials_used=materials_used or [],
        documents_related=documents_related or [],
        status=status,
        installed_at=installed_at,
        tested_at=tested_at,
        accepted_at=accepted_at,
        photos=photos or [],
        entry_id=entry_id,
    )
    db.add(construction)
    await db.commit()
    await db.refresh(construction)
    return construction


async def update_construction(
    db: AsyncSession,
    construction_id: UUID,
    **kwargs,
) -> Optional[ArchiveConstruction]:
    """Обновление конструкции"""
    construction = await db.get(ArchiveConstruction, construction_id)
    if not construction:
        return None

    for key, value in kwargs.items():
        if hasattr(construction, key):
            setattr(construction, key, value)

    await db.commit()
    await db.refresh(construction)
    return construction


async def delete_construction(db: AsyncSession, construction_id: UUID) -> bool:
    """Удаление конструкции"""
    construction = await db.get(ArchiveConstruction, construction_id)
    if not construction:
        return False

    await db.delete(construction)
    await db.commit()
    return True


async def pin_entry(db: AsyncSession, entry_id: UUID) -> Optional[ArchiveEntry]:
    """Закрепление записи"""
    entry = await db.get(ArchiveEntry, entry_id)
    if not entry:
        return None

    entry.is_pinned = True
    await db.commit()
    await db.refresh(entry)
    return entry


async def unpin_entry(db: AsyncSession, entry_id: UUID) -> Optional[ArchiveEntry]:
    """Открепление записи"""
    entry = await db.get(ArchiveEntry, entry_id)
    if not entry:
        return None

    entry.is_pinned = False
    await db.commit()
    await db.refresh(entry)
    return entry


async def soft_delete_entry(db: AsyncSession, entry_id: UUID) -> bool:
    """Soft delete записи"""
    entry = await db.get(ArchiveEntry, entry_id)
    if not entry:
        return False

    entry.is_deleted = True
    await db.commit()
    return True


async def get_statistics(db: AsyncSession, project_id: UUID) -> dict:
    """Статистика по проекту"""
    # Общее количество записей
    total_result = await db.execute(
        select(func.count()).where(
            ArchiveEntry.project_id == project_id,
            ArchiveEntry.is_deleted == False
        )
    )
    total_entries = total_result.scalar()

    # По типам
    by_type_result = await db.execute(
        select(
            ArchiveEntry.entry_type,
            func.count()
        ).where(
            ArchiveEntry.project_id == project_id,
            ArchiveEntry.is_deleted == False
        ).group_by(ArchiveEntry.entry_type)
    )
    by_type = {row[0].value: row[1] for row in by_type_result}

    # По месяцам
    by_month_result = await db.execute(
        select(
            func.to_char(ArchiveEntry.occurred_at, 'YYYY-MM'),
            func.count()
        ).where(
            ArchiveEntry.project_id == project_id,
            ArchiveEntry.is_deleted == False
        ).group_by(func.to_char(ArchiveEntry.occurred_at, 'YYYY-MM'))
        .order_by(func.to_char(ArchiveEntry.occurred_at, 'YYYY-MM').desc())
    )
    by_month = {row[0]: row[1] for row in by_month_result}

    # Материалы и конструкции
    materials_result = await db.execute(
        select(func.count()).where(
            ArchiveMaterial.project_id == project_id
        )
    )
    materials_count = materials_result.scalar()

    constructions_result = await db.execute(
        select(func.count()).where(
            ArchiveConstruction.project_id == project_id
        )
    )
    constructions_count = constructions_result.scalar()

    return {
        "total_entries": total_entries,
        "by_type": by_type,
        "by_month": by_month,
        "materials_count": materials_count,
        "constructions_count": constructions_count,
    }


async def link_entries(
    db: AsyncSession,
    entry_id: UUID,
    related_entry_ids: List[UUID],
) -> Optional[ArchiveEntry]:
    """Связывание записей архива"""
    entry = await db.get(ArchiveEntry, entry_id)
    if not entry:
        return None

    existing_ids = set(entry.related_entry_ids)
    existing_ids.update(related_entry_ids)
    entry.related_entry_ids = list(existing_ids)

    await db.commit()
    await db.refresh(entry)
    return entry
