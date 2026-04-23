"""Documents, revisions, remarks and approval workflow API router."""

from fastapi import APIRouter, Depends, HTTPException

from app.db.session import get_db
from app.modules.auth.deps import get_current_active_user
from app.modules.auth.models import User
from app.modules.documents.dependencies import router as deps_router
from app.modules.documents.service import DocumentService
from app.modules.documents.deps import get_document_service

router = APIRouter(tags=["documents"])
router.include_router(deps_router, prefix="/dependencies")


@router.get("", response_model=list)
async def list_documents(
    project_id: int = None,
    section_id: int = None,
    service: DocumentService = Depends(get_document_service),
):
    return await service.list_documents(project_id, section_id)


@router.post("", response_model=dict)
async def create_document(
    data: dict,
    current_user: User = Depends(get_current_active_user),
    service: DocumentService = Depends(get_document_service),
):
    return await service.create_document(data, current_user.id)


@router.patch("/{document_id}", response_model=dict)
async def update_document(
    document_id: int,
    data: dict,
    service: DocumentService = Depends(get_document_service),
):
    return await service.update_document(document_id, data)


@router.get("/{document_id}", response_model=dict)
async def get_document(
    document_id: int,
    service: DocumentService = Depends(get_document_service),
):
    return await service.get_document(document_id)


@router.post("/{document_id}/revisions", response_model=dict)
async def create_revision(
    document_id: int,
    data: dict,
    current_user: User = Depends(get_current_active_user),
    service: DocumentService = Depends(get_document_service),
):
    return await service.create_revision(document_id, data, current_user.id)


@router.post("/{document_id}/remarks", response_model=dict)
async def create_remark(
    document_id: int,
    data: dict,
    current_user: User = Depends(get_current_active_user),
    service: DocumentService = Depends(get_document_service),
):
    return await service.create_remark(document_id, data, current_user.id)


@router.patch("/remarks/{remark_id}/status", response_model=dict)
async def update_remark_status(
    remark_id: int,
    data: dict,
    service: DocumentService = Depends(get_document_service),
):
    return await service.update_remark_status(remark_id, data)


@router.post("/{document_id}/approval-workflows", response_model=dict)
async def start_approval_workflow(
    document_id: int,
    data: dict,
    service: DocumentService = Depends(get_document_service),
):
    return await service.start_approval_workflow(document_id, data)


@router.post("/{document_id}/render", response_model=dict)
async def render_document_endpoint(
    document_id: int,
    data: dict = {},
    service: DocumentService = Depends(get_document_service),
):
    return await service.render_document(document_id, data.get("extra_variables"))


@router.post("/cascade-update", response_model=dict)
async def cascade_update_endpoint(
    data: dict,
    service: DocumentService = Depends(get_document_service),
):
    return await service.cascade_update(
        data.get("project_id"),
        data.get("changed_keys", [])
    )


@router.post("/{document_id}/lock", response_model=dict)
async def lock_document(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    service: DocumentService = Depends(get_document_service),
):
    return await service.lock_document(document_id, current_user.id)


@router.post("/{document_id}/unlock", response_model=dict)
async def unlock_document(
    document_id: int,
    current_user: User = Depends(get_current_active_user),
    service: DocumentService = Depends(get_document_service),
):
    return await service.unlock_document(document_id, current_user.id)


@router.get("/remarks/all", response_model=list)
async def list_all_remarks(
    project_id: int = None,
    severity: str = None,
    status: str = None,
    remark_type: str = None,
    category: str = None,
    service: DocumentService = Depends(get_document_service),
):
    return await service.list_all_remarks(
        project_id, severity, status, remark_type, category
    )
