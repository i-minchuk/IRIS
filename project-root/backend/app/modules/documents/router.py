"""Documents, revisions, remarks and approval workflow API router."""

import os
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Query, UploadFile, File
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.db.session import get_db, get_db_read_only
from app.modules.auth.deps import get_current_active_user, is_admin
from app.modules.auth.models import User
from app.modules.documents.dependencies import router as deps_router
from app.modules.documents.service import DocumentService
from app.modules.documents.deps import get_document_service
from app.modules.documents.models import Document, Revision
from app.modules.documents.schemas import (
    DocumentCreateInput,
    DocumentUpdateInput,
    RevisionCreateInput,
    ApprovalWorkflowCreateInput,
    DocumentRenderRequest,
    CascadeUpdateRequest,
    LockRequestInput,
    DocumentBulkImportItem,
    DocumentBulkImportResponse,
)
from app.ai.classification import classify_document
from app.core.permissions import require_permission

router = APIRouter(tags=["documents"])
router.include_router(deps_router, prefix="/dependencies")

_docs_write = require_permission("documents.write")


@router.get("", response_model=dict)
async def list_documents(
    project_id: int = None,
    section_id: int = None,
    status: str = Query(None, description="Filter by status"),
    document_type: str = Query(None, description="Filter by document type"),
    include_deleted: bool = Query(False, description="Include excluded documents"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db_read_only),
    current_user: User = Depends(get_current_active_user),
    service: DocumentService = Depends(get_document_service),
):
    """List documents with optional filters and pagination."""
    from app.core.permissions import needs_document_scope
    from app.modules.documents.crud import get_documents, user_document_access_clause

    # Объектный уровень (этап 3): scoped-роли видят только документы своей привязки
    access_clause = None
    if needs_document_scope(current_user):
        access_clause = user_document_access_clause(current_user.id)

    skip = (page - 1) * page_size
    docs = await get_documents(
        db,
        project_id=project_id,
        status=status,
        document_type=document_type,
        include_deleted=include_deleted,
        skip=skip,
        limit=page_size,
        access_clause=access_clause,
    )

    # Count total for pagination
    count_query = select(func.count()).select_from(Document)
    filters = [Document.is_deleted.is_(include_deleted)]
    if project_id:
        filters.append(Document.project_id == project_id)
    if status:
        filters.append(Document.status == status)
    if document_type:
        filters.append(Document.doc_type == document_type)
    if access_clause is not None:
        filters.append(access_clause)
    if filters:
        count_query = count_query.where(and_(*filters))
    total = await db.scalar(count_query)

    # Признак наличия файла у документа (один запрос на всю страницу)
    has_file_ids: set[int] = set()
    if docs:
        rows = await db.execute(
            select(Revision.document_id).where(
                Revision.document_id.in_([d.id for d in docs]),
                Revision.file_path.is_not(None),
            ).distinct()
        )
        has_file_ids = set(rows.scalars().all())

    items = [
        {
            "id": d.id,
            "number": d.number,
            "name": d.name,
            "doc_type": d.doc_type,
            "status": d.status,
            "crs_code": d.crs_code,
            "author_id": d.author_id,
            "project_id": d.project_id,
            "section_id": d.section_id,
            "process_task_id": d.process_task_id,
            "is_deleted": d.is_deleted,
            "deleted_at": d.deleted_at.isoformat() if d.deleted_at else None,
            "delete_reason": d.delete_reason,
            "created_at": d.created_at.isoformat() if d.created_at else None,
            "planned_end": d.planned_end.isoformat() if d.planned_end else None,
            "planned_ready": d.planned_ready.isoformat() if d.planned_ready else None,
            "has_file": d.id in has_file_ids,
        }
        for d in docs
    ]
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size,
    }


@router.post("", response_model=dict, status_code=201)
async def create_document(
    data: DocumentCreateInput,
    current_user: User = Depends(_docs_write),
    service: DocumentService = Depends(get_document_service),
):
    return await service.create_document(data.model_dump(), current_user.id)


@router.get("/approval-feed", response_model=list)
async def approval_feed(
    current_user: User = Depends(get_current_active_user),
    service: DocumentService = Depends(get_document_service),
):
    """Лента согласований по документам (для вкладки «Документооборот»)."""
    return await service.approval_feed()


class ActionTaskStatusInput(BaseModel):
    status: str


@router.get("/action-tasks/statuses", response_model=dict)
async def action_task_statuses(
    current_user: User = Depends(get_current_active_user),
    service: DocumentService = Depends(get_document_service),
):
    """Статусы производных задач документооборота текущего пользователя."""
    return {"statuses": await service.get_action_task_statuses(current_user.id)}


@router.put("/action-tasks/{task_key}/status", response_model=dict)
async def set_action_task_status(
    task_key: str,
    data: ActionTaskStatusInput,
    current_user: User = Depends(_docs_write),
    service: DocumentService = Depends(get_document_service),
):
    """Сохранить статус производной задачи (new/in_progress/done)."""
    if not task_key or len(task_key) > 100:
        raise HTTPException(status_code=400, detail="Некорректный ключ задачи")
    return await service.set_action_task_status(
        current_user.id, task_key, data.status
    )


@router.post("/deadline-check", response_model=dict)
async def run_document_deadline_check(
    current_user: User = Depends(get_current_active_user),
    service: DocumentService = Depends(get_document_service),
):
    """Запустить проверку дедлайнов согласования документов (только админ).

    Обычно вызывается фоновым циклом каждые 15 минут; эндпоинт — для
    ручной проверки и отладки. Напоминание уходит один раз на документ.
    """
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Требуются права администратора")
    return await service.check_document_deadlines()


class DelegationCreateInput(BaseModel):
    delegate_id: int
    days: int = 7
    user_id: Optional[int] = None  # только админ может указать чужой


@router.post("/delegations", response_model=dict, status_code=201)
async def create_delegation(
    data: DelegationCreateInput,
    current_user: User = Depends(get_current_active_user),
    service: DocumentService = Depends(get_document_service),
):
    """Временно делегировать свои согласования документов другому пользователю.

    Администратор может делегировать согласования любого пользователя
    (поле user_id). Авто-возврат — по истечении срока.
    """
    return await service.create_delegation(
        user_id=data.user_id or current_user.id,
        delegate_id=data.delegate_id,
        days=data.days,
        actor_id=current_user.id,
    )


@router.get("/delegations/mine", response_model=dict)
async def list_my_delegations(
    current_user: User = Depends(get_current_active_user),
    service: DocumentService = Depends(get_document_service),
):
    """Активные делегирования: свои (я делегировал) и входящие (мне)."""
    return await service.list_my_delegations(current_user.id)


@router.delete("/delegations/{delegation_id}", response_model=dict)
async def cancel_delegation(
    delegation_id: int,
    current_user: User = Depends(get_current_active_user),
    service: DocumentService = Depends(get_document_service),
):
    """Отменить делегирование (владелец, делегат или админ)."""
    return await service.cancel_delegation(delegation_id, current_user.id)


@router.post("/{document_id}/remind", response_model=dict)
async def remind_document_approvers(
    document_id: int,
    current_user: User = Depends(_docs_write),
    service: DocumentService = Depends(get_document_service),
):
    """Напомнить вручную несогласовавшим согласующим (и их делегатам)."""
    return await service.remind_approvers(document_id, current_user.id)


@router.patch("/{document_id}", response_model=dict)
async def update_document(
    document_id: int,
    data: DocumentUpdateInput,
    current_user: User = Depends(_docs_write),
    service: DocumentService = Depends(get_document_service),
):
    return await service.update_document(document_id, data.model_dump(exclude_unset=True), actor_id=current_user.id)


@router.post("/{document_id}/copy", response_model=dict)
async def copy_document(
    document_id: int,
    current_user: User = Depends(_docs_write),
    service: DocumentService = Depends(get_document_service),
):
    """Создать копию документа в том же проекте."""
    return await service.copy_document(document_id, current_user.id)


@router.delete("/{document_id}", response_model=dict)
async def exclude_document(
    document_id: int,
    reason: str = Query(None, max_length=500, description="Причина исключения из работы"),
    current_user: User = Depends(_docs_write),
    service: DocumentService = Depends(get_document_service),
):
    """Исключить документ из работы (мягкое удаление, возврат возможен)."""
    return await service.soft_delete_document(document_id, current_user.id, reason)


@router.post("/{document_id}/restore", response_model=dict)
async def restore_document(
    document_id: int,
    current_user: User = Depends(_docs_write),
    service: DocumentService = Depends(get_document_service),
):
    """Вернуть ранее исключённый документ в работу."""
    return await service.restore_document(document_id)


@router.get("/{document_id}", response_model=dict)
async def get_document(
    document_id: int,
    db: AsyncSession = Depends(get_db_read_only),
    current_user: User = Depends(get_current_active_user),
    service: DocumentService = Depends(get_document_service),
):
    from app.core.permissions import needs_document_scope
    from app.modules.documents.crud import get_document as _get_doc, user_has_document_access

    if needs_document_scope(current_user):
        doc = await _get_doc(db, document_id)
        if not doc or not user_has_document_access(doc, current_user.id):
            raise HTTPException(status_code=404, detail="Document not found")
    return await service.get_document(document_id)


@router.post("/{document_id}/revisions", response_model=dict)
async def create_revision(
    document_id: int,
    data: RevisionCreateInput,
    current_user: User = Depends(_docs_write),
    service: DocumentService = Depends(get_document_service),
):
    return await service.create_revision(document_id, data.model_dump(), current_user.id)


@router.post("/import", response_model=DocumentBulkImportResponse, status_code=201)
async def import_documents(
    items: list[DocumentBulkImportItem],
    current_user: User = Depends(_docs_write),
    service: DocumentService = Depends(get_document_service),
):
    """Bulk import documents from an external registry (MDR / Excel)."""
    imported = await service.bulk_import_documents([item.model_dump() for item in items], current_user.id)
    return DocumentBulkImportResponse(created=len(imported), items=imported)


@router.post("/{document_id}/upload", response_model=dict)
async def upload_document_file(
    document_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(_docs_write),
    service: DocumentService = Depends(get_document_service),
):
    """Upload a file for a document and create a revision."""
    content = await file.read()
    return await service.upload_document_file(document_id, content, file.filename, current_user.id)


@router.post("/{document_id}/approval-workflows", response_model=dict)
async def start_approval_workflow(
    document_id: int,
    data: ApprovalWorkflowCreateInput,
    current_user: User = Depends(_docs_write),
    service: DocumentService = Depends(get_document_service),
):
    return await service.start_approval_workflow(document_id, data.model_dump())


@router.post("/{document_id}/render", response_model=dict)
async def render_document_endpoint(
    document_id: int,
    data: DocumentRenderRequest = DocumentRenderRequest(),
    current_user: User = Depends(_docs_write),
    service: DocumentService = Depends(get_document_service),
):
    return await service.render_document(document_id, data.extra_variables)


@router.post("/cascade-update", response_model=dict)
async def cascade_update_endpoint(
    data: CascadeUpdateRequest,
    current_user: User = Depends(_docs_write),
    service: DocumentService = Depends(get_document_service),
):
    return await service.cascade_update(
        data.project_id,
        data.changed_keys
    )


@router.get("/generated/{stored_name}")
async def download_generated_file(
    stored_name: str,
    current_user: User = Depends(get_current_active_user),
):
    """Отдача сгенерированных файлов (storage/generated, например титульные листы)."""
    from pathlib import Path

    from app.core.config import settings

    stem, dot, ext = stored_name.rpartition(".")
    if (
        not dot
        or ext.lower() != "pdf"
        or not stem
        or not stem.replace("-", "").replace("_", "").isalnum()
    ):
        raise HTTPException(status_code=400, detail="Invalid file name")
    path = Path(settings.IRIS_STORAGE_ROOT) / "generated" / stored_name
    if not path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(str(path), filename=stored_name)


@router.get("/{document_id}/title-sheet")
async def download_title_sheet(
    document_id: int,
    db: AsyncSession = Depends(get_db_read_only),
    current_user: User = Depends(get_current_active_user),
):
    """Сформировать и скачать титульный лист документа (PDF, А4)."""
    import io

    from fastapi.responses import StreamingResponse

    from app.modules.documents.title_sheet import (
        build_title_sheet_bytes,
        collect_title_sheet_fields,
    )

    try:
        fields = await collect_title_sheet_fields(db, document_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Document not found")
    pdf = build_title_sheet_bytes(fields)
    return StreamingResponse(
        io.BytesIO(pdf),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="title_sheet_{document_id}.pdf"'
        },
    )


@router.get("/{document_id}/revisions/{revision_id}/download")
async def download_revision_file(
    document_id: int,
    revision_id: int,
    db: AsyncSession = Depends(get_db_read_only),
    current_user: User = Depends(get_current_active_user),
):
    """Скачать файл ревизии документа."""
    from app.core.permissions import needs_document_scope
    from app.modules.documents.crud import get_document as _get_doc, user_has_document_access

    if needs_document_scope(current_user):
        doc = await _get_doc(db, document_id)
        if not doc or not user_has_document_access(doc, current_user.id):
            raise HTTPException(status_code=404, detail="Document not found")

    result = await db.execute(
        select(Revision).where(
            Revision.id == revision_id,
            Revision.document_id == document_id,
        )
    )
    revision = result.scalar_one_or_none()
    if not revision or not revision.file_path:
        raise HTTPException(status_code=404, detail="File not found")
    if not os.path.exists(revision.file_path):
        raise HTTPException(status_code=404, detail="File missing on storage")

    filename = os.path.basename(revision.file_path)
    if revision.changes_summary and "File uploaded:" in revision.changes_summary:
        original = revision.changes_summary.split("File uploaded:", 1)[1].strip()
        if original:
            filename = original
    return FileResponse(revision.file_path, filename=filename)


@router.post("/{document_id}/lock", response_model=dict)
async def lock_document(
    document_id: int,
    request: Request,
    current_user: User = Depends(_docs_write),
    service: DocumentService = Depends(get_document_service),
):
    result = await service.lock_document(document_id, current_user.id)
    ws_manager = request.app.state.ws_manager
    await ws_manager.broadcast_to_document(
        document_id,
        {
            "type": "document_locked",
            "payload": {
                "document_id": document_id,
                "locked_by": current_user.id,
                "locked_by_name": current_user.full_name or current_user.email,
            },
        },
        exclude_user_id=current_user.id,
    )
    return result


@router.post("/{document_id}/unlock", response_model=dict)
async def unlock_document(
    document_id: int,
    request: Request,
    current_user: User = Depends(_docs_write),
    service: DocumentService = Depends(get_document_service),
):
    result = await service.unlock_document(document_id, current_user.id)
    ws_manager = request.app.state.ws_manager
    await ws_manager.broadcast_to_document(
        document_id,
        {
            "type": "document_unlocked",
            "payload": {"document_id": document_id, "unlocked_by": current_user.id},
        },
        exclude_user_id=current_user.id,
    )
    return result


@router.post("/{document_id}/submit-for-approval", response_model=dict)
async def submit_for_approval(
    document_id: int,
    current_user: User = Depends(_docs_write),
    service: DocumentService = Depends(get_document_service),
):
    return await service.submit_for_approval(document_id, current_user.id)


@router.post("/{document_id}/submit-for-review", response_model=dict)
async def submit_for_review(
    document_id: int,
    current_user: User = Depends(_docs_write),
    service: DocumentService = Depends(get_document_service),
):
    return await service.submit_for_review(document_id, current_user.id)


@router.post("/{document_id}/approve", response_model=dict)
async def approve_document(
    document_id: int,
    current_user: User = Depends(_docs_write),
    service: DocumentService = Depends(get_document_service),
):
    """Согласовать документ: переход к следующему согласующему или утверждение."""
    return await service.approve_document(document_id, current_user.id)


@router.post("/{document_id}/classify", response_model=dict)
async def classify_document_endpoint(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_docs_write),
):
    """Run AI classification on a document and persist the result."""
    result = await db.execute(select(Document).where(Document.id == document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    content = ""
    if doc.content and isinstance(doc.content, dict):
        content = doc.content.get("body") or doc.content.get("text") or ""
    if not content:
        content = doc.name or ""

    result_data = await classify_document(content)
    doc.ai_classified_type = result_data.get("type")
    doc.ai_confidence = result_data.get("confidence")
    await db.commit()
    return result_data


@router.post("/suggest-fields", response_model=dict)
async def suggest_fields(request: dict, db: AsyncSession = Depends(get_db), current_user: User = Depends(_docs_write)):
    from app.ai.autofill import suggest_document_fields
    return await suggest_document_fields(
        request.get("template_type"), request.get("project_name", "")
    )


