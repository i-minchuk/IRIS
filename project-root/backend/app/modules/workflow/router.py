"""Workflow API endpoints."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.auth.deps import get_current_active_user
from app.modules.auth.models import User
from app.modules.workflow.models import WorkflowStatus
from app.modules.workflow.service import WorkflowService
from app.modules.workflow.schemas import (
    WorkflowTemplateCreate,
    WorkflowTemplateUpdate,
    WorkflowTemplateResponse,
    WorkflowTemplateListResponse,
    WorkflowInstanceCreate,
    WorkflowInstanceResponse,
    WorkflowInstanceListResponse,
    ApprovalAction,
    RejectionAction,
    DelegationAction,
    WorkflowCommentCreate,
    WorkflowCommentResponse,
    WorkflowAuditLogResponse,
    WorkflowAuditLogListResponse,
    PREDEFINED_TEMPLATES
)

router = APIRouter(prefix="/workflows", tags=["workflows"])


def get_service(db: AsyncSession) -> WorkflowService:
    """Get workflow service."""
    return WorkflowService(db)


# ==================== Template Endpoints ====================

@router.post("/templates", response_model=WorkflowTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(
    template_data: WorkflowTemplateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new workflow template."""
    service = get_service(db)
    
    # Check if code already exists
    existing = await service.get_template_by_code(template_data.code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Template with code '{template_data.code}' already exists"
        )
    
    template = await service.create_template(template_data, current_user.id)
    return template


@router.get("/templates", response_model=WorkflowTemplateListResponse)
async def list_templates(
    active_only: bool = Query(True),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List all workflow templates."""
    service = get_service(db)
    templates, total = await service.get_templates(active_only, page, page_size)
    
    # Add predefined templates if none exist
    if total == 0:
        for predef in PREDEFINED_TEMPLATES:
            from app.modules.workflow.schemas import WorkflowTemplateCreate
            tpl_create = WorkflowTemplateCreate(
                name=predef["name"],
                code=predef["code"],
                description=predef["description"],
                steps_schema=predef["steps_schema"],
                is_default=True
            )
            await service.create_template(tpl_create, current_user.id)
        
        templates, total = await service.get_templates(active_only, page, page_size)
    
    return WorkflowTemplateListResponse(
        templates=[WorkflowTemplateResponse.model_validate(t) for t in templates],
        total=total
    )


@router.get("/templates/predefined", response_model=list)
async def list_predefined_templates(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get list of predefined template definitions."""
    return PREDEFINED_TEMPLATES


@router.get("/templates/{template_id}", response_model=WorkflowTemplateResponse)
async def get_template(
    template_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get workflow template by ID."""
    service = get_service(db)
    template = await service.get_template(template_id)
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    return WorkflowTemplateResponse.model_validate(template)


@router.patch("/templates/{template_id}", response_model=WorkflowTemplateResponse)
async def update_template(
    template_id: int,
    update_data: WorkflowTemplateUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update workflow template."""
    service = get_service(db)
    template = await service.update_template(template_id, update_data)
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )
    
    return WorkflowTemplateResponse.model_validate(template)


@router.delete("/templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Soft delete workflow template."""
    service = get_service(db)
    success = await service.delete_template(template_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )


# ==================== Instance Endpoints ====================

@router.post("/start", response_model=WorkflowInstanceResponse, status_code=status.HTTP_201_CREATED)
async def start_workflow(
    instance_data: WorkflowInstanceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Start a new workflow instance."""
    service = get_service(db)
    
    try:
        instance = await service.create_instance(instance_data, current_user.id)
        return WorkflowInstanceResponse.model_validate(instance)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/instances", response_model=WorkflowInstanceListResponse)
async def list_instances(
    status: Optional[str] = Query(None),
    document_id: Optional[int] = Query(None),
    project_id: Optional[int] = Query(None),
    my_tasks: bool = Query(False),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List workflow instances with filters."""
    # TODO: Implement filtering logic
    service = get_service(db)
    
    # Placeholder - return empty list for now
    return WorkflowInstanceListResponse(
        instances=[],
        total=0,
        page=page,
        page_size=page_size
    )


@router.get("/instances/{instance_id}", response_model=WorkflowInstanceResponse)
async def get_instance(
    instance_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get workflow instance by ID."""
    service = get_service(db)
    instance = await service.get_instance(instance_id)
    
    if not instance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Instance not found"
        )
    
    return WorkflowInstanceResponse.model_validate(instance)


@router.get("/instances/document/{document_id}", response_model=list)
async def get_document_instances(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get workflow instances for a document."""
    service = get_service(db)
    instances = await service.get_instances_by_document(document_id)
    return [WorkflowInstanceResponse.model_validate(i) for i in instances]


# ==================== Step Action Endpoints ====================

@router.post("/steps/{step_id}/approve", response_model=dict)
async def approve_step(
    step_id: int,
    action: ApprovalAction,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Approve current workflow step."""
    service = get_service(db)
    
    try:
        step, next_step = await service.approve_step(step_id, current_user.id, action)
        
        result = {
            "step_id": step.id,
            "status": "approved",
            "message": "Step approved successfully"
        }
        
        if next_step:
            result["next_step"] = {
                "id": next_step.id,
                "name": next_step.step_name,
                "status": next_step.status.value
            }
        else:
            result["workflow_completed"] = True
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/steps/{step_id}/reject", response_model=dict)
async def reject_step(
    step_id: int,
    action: RejectionAction,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Reject workflow step."""
    service = get_service(db)
    
    try:
        return_step = await service.reject_step(step_id, current_user.id, action)
        
        return {
            "step_id": step_id,
            "status": "rejected",
            "message": "Step rejected",
            "return_to_step": return_step.id if return_step else None
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/steps/{step_id}/delegate", response_model=dict)
async def delegate_step(
    step_id: int,
    action: DelegationAction,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delegate workflow step to another user."""
    service = get_service(db)
    
    try:
        step = await service.delegate_step(step_id, current_user.id, action)
        
        return {
            "step_id": step.id,
            "status": "delegated",
            "message": "Step delegated successfully",
            "delegate_to": action.delegate_to
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ==================== Comment Endpoints ====================

@router.post("/steps/{step_id}/comments", response_model=WorkflowCommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    step_id: int,
    comment_data: WorkflowCommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a comment on a workflow step."""
    service = get_service(db)
    
    try:
        comment = await service.create_comment(
            step_id,
            current_user.id,
            comment_data.text,
            comment_data.page_number,
            comment_data.coordinates
        )
        return WorkflowCommentResponse.model_validate(comment)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/steps/{step_id}/comments", response_model=list)
async def get_step_comments(
    step_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all comments for a workflow step."""
    service = get_service(db)
    # TODO: Implement comment retrieval
    return []


# ==================== Audit Log Endpoints ====================

@router.get("/audit/{instance_id}", response_model=WorkflowAuditLogListResponse)
async def get_audit_log(
    instance_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get audit log for workflow instance."""
    service = get_service(db)
    logs = await service.get_audit_log(instance_id)
    
    return WorkflowAuditLogListResponse(
        logs=[WorkflowAuditLogResponse.model_validate(log) for log in logs],
        total=len(logs)
    )
