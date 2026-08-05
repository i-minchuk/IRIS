"""Documents, revisions, remarks and approval workflow API router."""

from fastapi import APIRouter, Depends, HTTPException, Request, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.db.session import get_db, get_db_read_only
from app.modules.auth.deps import get_current_active_user
from app.modules.auth.models import User
from app.modules.documents.dependencies import router as deps_router
from app.modules.documents.service import DocumentService
from app.modules.documents.deps import get_document_service
from app.modules.documents.models import Document
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

router = APIRouter(tags=["documents"])
router.include_router(deps_router, prefix="/dependencies")


@router.get("", response_model=dict)
async def list_documents(
    project_id: int = None,
    section_id: int = None,
    status: str = Query(None, description="Filter by status"),
    document_type: str = Query(None, description="Filter by document type"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db_read_only),
    service: DocumentService = Depends(get_document_service),
):
    """List documents with optional filters and pagination."""
    from app.modules.documents.crud import get_documents
    
    skip = (page - 1) * page_size
    docs = await get_documents(
        db,
        project_id=project_id,
        status=status,
        document_type=document_type,
        skip=skip,
        limit=page_size
    )
    
    # Count total for pagination
    count_query = select(func.count()).select_from(Document)
    filters = []
    if project_id:
        filters.append(Document.project_id == project_id)
    if status:
        filters.append(Document.status == status)
    if document_type:
        filters.append(Document.doc_type == document_type)
    if filters:
        count_query = count_query.where(and_(*filters))
    total = await db.scalar(count_query)
    
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
            "created_at": d.created_at.isoformat() if d.created_at else None,
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
    current_user: User = Depends(get_current_active_user),
    service: DocumentService = Depends(get_document_service),
):
    return await service.create_document(data.model_dump(), current_user.id)


@router.patch("/{document_id}", response_model=dict)
async def update_document(
    document_id: int,
    data: DocumentUpdateInput,
    service: DocumentService = Depends(get_document_service),
):
    return await service.update_document(document_id, data.model_dump(exclude_unset=True))


@router.get("/{document_id}", response_model=dict)
async def get_document(
    document_id: int,
    service: DocumentService = Depends(get_document_service),
):
    return await service.get_document(document_id)


@router.post("/{document_id}/revisions", response_model=dict)
async def create_revision(
    document_id: int,
    data: RevisionCreateInput,
    current_user: User = Depends(get_current_active_user),
    service: DocumentService = Depends(get_document_service),
):
    return await service.create_revision(document_id, data.model_dump(), current_user.id)


@router.post("/import", response_model=DocumentBulkImportResponse, status_code=201)
async def import_documents(
    items: list[DocumentBulkImportItem],
    current_user: User = Depends(get_current_active_user),
    service: DocumentService = Depends(get_document_service),
):
    """Bulk import documents from an external registry (MDR / Excel)."""
    imported = await service.bulk_import_documents([item.model_dump() for item in items], current_user.id)
    return DocumentBulkImportResponse(created=len(imported), items=imported)


@router.post("/{document_id}/upload", response_model=dict)
async def upload_document_file(
    document_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    service: DocumentService = Depends(get_document_service),
):
    """Upload a file for a document and create a revision."""
    content = await file.read()
    return await service.upload_document_file(document_id, content, file.filename, current_user.id)


@router.post("/{document_id}/approval-workflows", response_model=dict)
async def start_approval_workflow(
    document_id: int,
    data: ApprovalWorkflowCreateInput,
    service: DocumentService = Depends(get_document_service),
):
    return await service.start_approval_workflow(document_id, data.model_dump())


@router.post("/{document_id}/render", response_model=dict)
async def render_document_endpoint(
    document_id: int,
    data: DocumentRenderRequest = DocumentRenderRequest(),
    service: DocumentService = Depends(get_document_service),
):
    return await service.render_document(document_id, data.extra_variables)


@router.post("/cascade-update", response_model=dict)
async def cascade_update_endpoint(
    data: CascadeUpdateRequest,
    service: DocumentService = Depends(get_document_service),
):
    return await service.cascade_update(
        data.project_id,
        data.changed_keys
    )


@router.post("/{document_id}/lock", response_model=dict)
async def lock_document(
    document_id: int,
    request: Request,
    current_user: User = Depends(get_current_active_user),
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
    current_user: User = Depends(get_current_active_user),
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
    current_user: User = Depends(get_current_active_user),
    service: DocumentService = Depends(get_document_service),
):
    return await service.submit_for_approval(document_id, current_user.id)


@router.post("/{document_id}/submit-for-review", response_model=dict)
async def submit_for_review(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    service: DocumentService = Depends(get_document_service),
):
    return await service.submit_for_review(document_id, current_user.id)


@router.post("/{document_id}/classify", response_model=dict)
async def classify_document_endpoint(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
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
async def suggest_fields(request: dict, db: AsyncSession = Depends(get_db)):
    from app.ai.autofill import suggest_document_fields
    return await suggest_document_fields(
        request.get("template_type"), request.get("project_name", "")
    )


