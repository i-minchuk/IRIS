"""Service for automatic archiving of system events"""
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import archive as archive_crud
from app.models.archive import ArchiveEntryType, ArchiveMaterialType, ArchiveConstructionType


async def archive_document_event(
    db: AsyncSession,
    doc_id: UUID,
    project_id: UUID,
    action: str,
    doc_data: dict,
    author_id: Optional[UUID] = None,
) -> None:
    """Архивация событий документов"""
    type_map = {
        "created": ArchiveEntryType.DOCUMENT,
        "updated": ArchiveEntryType.REVISION,
        "deleted": ArchiveEntryType.DOCUMENT,
        "approved": ArchiveEntryType.WORKFLOW,
        "sent": ArchiveEntryType.WORKFLOW,
    }

    entry_type = type_map.get(action, ArchiveEntryType.DOCUMENT)
    title_map = {
        "created": f"Создан документ: {doc_data.get('name', 'Без названия')}",
        "updated": f"Обновлена ревизия документа: {doc_data.get('name', 'Без названия')}",
        "deleted": f"Удален документ: {doc_data.get('name', 'Без названия')}",
        "approved": f"Документ одобрен: {doc_data.get('name', 'Без названия')}",
        "sent": f"Документ отправлен: {doc_data.get('name', 'Без названия')}",
    }

    await archive_crud.create_entry(
        db=db,
        project_id=project_id,
        entry_type=entry_type,
        source_table="documents",
        source_id=doc_id,
        title=title_map.get(action, f"Событие документа: {action}"),
        description=doc_data.get('description'),
        content_snapshot=doc_data,
        author_id=author_id,
        occurred_at=datetime.utcnow(),
        tags=[doc_data.get('type', 'document'), doc_data.get('status', 'unknown')],
    )


async def archive_workflow_event(
    db: AsyncSession,
    instance_id: UUID,
    project_id: UUID,
    step_id: UUID,
    action: str,
    workflow_data: dict,
    author_id: Optional[UUID] = None,
) -> None:
    """Архивация событий workflow"""
    title_map = {
        "started": "Запущено согласование",
        "approved": "Этап согласования одобрен",
        "rejected": "Этап согласования отклонен",
        "completed": "Согласование завершено",
    }

    await archive_crud.create_entry(
        db=db,
        project_id=project_id,
        entry_type=ArchiveEntryType.WORKFLOW,
        source_table="workflow_instances",
        source_id=instance_id,
        title=title_map.get(action, f"Событие workflow: {action}"),
        content_snapshot=workflow_data,
        author_id=author_id,
        occurred_at=datetime.utcnow(),
        tags=["workflow", action],
        related_entry_ids=[step_id] if step_id else [],
    )


async def archive_remark_event(
    db: AsyncSession,
    remark_id: UUID,
    project_id: UUID,
    action: str,
    remark_data: dict,
    author_id: Optional[UUID] = None,
) -> None:
    """Архивация событий замечаний"""
    type_map = {
        "created": ArchiveEntryType.REMARK,
        "updated": ArchiveEntryType.REMARK,
        "fixed": ArchiveEntryType.REMARK,
        "resolved": ArchiveEntryType.REMARK,
        "rejected": ArchiveEntryType.REMARK,
    }

    title_map = {
        "created": f"Создано замечание: {remark_data.get('text', '')[:50]}...",
        "updated": f"Обновлено замечание #{remark_data.get('id', '')}",
        "fixed": f"Исправлено замечание #{remark_data.get('id', '')}",
        "resolved": f"Разрешено замечание #{remark_data.get('id', '')}",
        "rejected": f"Отклонено замечание #{remark_data.get('id', '')}",
    }

    await archive_crud.create_entry(
        db=db,
        project_id=project_id,
        entry_type=type_map.get(action, ArchiveEntryType.REMARK),
        source_table="remarks",
        source_id=remark_id,
        title=title_map.get(action, f"Событие замечания: {action}"),
        description=remark_data.get('text'),
        content_snapshot=remark_data,
        author_id=author_id,
        occurred_at=datetime.utcnow(),
        tags=["remark", remark_data.get('status', 'unknown')],
    )


async def archive_project_event(
    db: AsyncSession,
    project_id: UUID,
    event_type: str,
    event_data: dict,
    author_id: Optional[UUID] = None,
) -> None:
    """Архивация событий проекта"""
    type_map = {
        "status_changed": ArchiveEntryType.PROJECT_EVENT,
        "member_added": ArchiveEntryType.PROJECT_EVENT,
        "member_removed": ArchiveEntryType.PROJECT_EVENT,
        "budget_updated": ArchiveEntryType.PROJECT_EVENT,
        "deadline_changed": ArchiveEntryType.PROJECT_EVENT,
    }

    title_map = {
        "status_changed": f"Изменен статус проекта на: {event_data.get('new_status', '')}",
        "member_added": f"Добавлен участник: {event_data.get('member_name', '')}",
        "member_removed": f"Удален участник: {event_data.get('member_name', '')}",
        "budget_updated": "Обновлен бюджет проекта",
        "deadline_changed": "Изменен дедлайн проекта",
    }

    await archive_crud.create_entry(
        db=db,
        project_id=project_id,
        entry_type=type_map.get(event_type, ArchiveEntryType.PROJECT_EVENT),
        source_table="projects",
        source_id=project_id,
        title=title_map.get(event_type, f"Событие проекта: {event_type}"),
        content_snapshot=event_data,
        author_id=author_id,
        occurred_at=datetime.utcnow(),
        tags=["project", event_type],
    )


async def archive_file_upload(
    db: AsyncSession,
    file_id: UUID,
    project_id: UUID,
    source_table: str,
    source_id: UUID,
    file_data: dict,
    author_id: Optional[UUID] = None,
) -> None:
    """Архивация загрузки файла"""
    await archive_crud.create_entry(
        db=db,
        project_id=project_id,
        entry_type=ArchiveEntryType.FILE_UPLOAD,
        source_table=source_table,
        source_id=source_id,
        title=f"Загружен файл: {file_data.get('filename', 'Без имени')}",
        content_snapshot=file_data,
        author_id=author_id,
        occurred_at=datetime.utcnow(),
        tags=["file", file_data.get('type', 'unknown')],
        attachments=[{
            "filename": file_data.get('filename'),
            "url": file_data.get('url'),
            "type": file_data.get('type'),
            "size": file_data.get('size'),
        }],
    )


async def archive_material_created(
    db: AsyncSession,
    material_id: UUID,
    project_id: UUID,
    material_data: dict,
    author_id: Optional[UUID] = None,
) -> None:
    """Архивация создания материала"""
    entry = await archive_crud.create_entry(
        db=db,
        project_id=project_id,
        entry_type=ArchiveEntryType.MATERIAL,
        source_table="archive_materials",
        source_id=material_id,
        title=f"Добавлен материал: {material_data.get('name', 'Без названия')}",
        content_snapshot=material_data,
        author_id=author_id,
        occurred_at=datetime.utcnow(),
        tags=["material", material_data.get('material_type', 'unknown')],
    )

    # Связываем запись с материалом
    await archive_crud.update_material(db, material_id, entry_id=entry.id)


async def archive_construction_created(
    db: AsyncSession,
    construction_id: UUID,
    project_id: UUID,
    construction_data: dict,
    author_id: Optional[UUID] = None,
) -> None:
    """Архивация создания конструкции"""
    entry = await archive_crud.create_entry(
        db=db,
        project_id=project_id,
        entry_type=ArchiveEntryType.CONSTRUCTION,
        source_table="archive_constructions",
        source_id=construction_id,
        title=f"Добавлена конструкция: {construction_data.get('name', 'Без названия')}",
        content_snapshot=construction_data,
        author_id=author_id,
        occurred_at=datetime.utcnow(),
        tags=["construction", construction_data.get('construction_type', 'unknown')],
    )

    # Связываем запись с конструкцией
    await archive_crud.update_construction(db, construction_id, entry_id=entry.id)
