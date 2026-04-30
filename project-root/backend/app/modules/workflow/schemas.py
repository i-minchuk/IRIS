"""Pydantic schemas for Workflow API."""
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.modules.workflow.models import (
    WorkflowStatus, WorkflowStepStatus, ApprovalType, AssignmentType
)


# ============== Template Schemas ==============

class WorkflowStepSchema(BaseModel):
    """Schema for a single workflow step in template."""
    id: str = Field(..., description="Уникальный ключ шага")
    name: str = Field(..., description="Название этапа")
    role: Optional[str] = Field(None, description="Роль (role-based assignment)")
    user_ids: Optional[List[int]] = Field(None, description="Конкретные пользователи")
    assignment_type: AssignmentType = Field(default=AssignmentType.SEQUENTIAL)
    approval_type: ApprovalType = Field(default=ApprovalType.APPROVE)
    deadline_hours: Optional[int] = Field(None, description="Срок в часах")
    auto_transition: Optional[Dict[str, str]] = Field(None, description="Автопереходы")


class WorkflowTemplateCreate(BaseModel):
    """Create workflow template."""
    name: str = Field(..., min_length=1, max_length=255)
    code: str = Field(..., min_length=1, max_length=100, pattern=r'^[a-z_]+$')
    description: Optional[str] = None
    steps_schema: List[WorkflowStepSchema] = Field(..., min_length=1)
    is_default: bool = False


class WorkflowTemplateUpdate(BaseModel):
    """Update workflow template."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    steps_schema: Optional[List[WorkflowStepSchema]] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None


class WorkflowStepResponse(WorkflowStepSchema):
    """Response schema for workflow step."""
    order_index: int = 0


class WorkflowTemplateResponse(BaseModel):
    """Response schema for workflow template."""
    id: int
    name: str
    code: str
    description: Optional[str]
    steps_schema: List[WorkflowStepResponse]
    is_active: bool
    is_default: bool
    created_by: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WorkflowTemplateListResponse(BaseModel):
    """List of workflow templates."""
    templates: List[WorkflowTemplateResponse]
    total: int


# ============== Instance Schemas ==============

class WorkflowInstanceCreate(BaseModel):
    """Start a new workflow instance."""
    template_id: int = Field(..., gt=0)
    document_id: Optional[int] = Field(None, gt=0)
    document_revision: Optional[int] = Field(None, gt=0)
    document_name: Optional[str] = None
    project_id: Optional[int] = Field(None, gt=0)
    launch_comment: Optional[str] = None


class WorkflowStepInstanceResponse(BaseModel):
    """Response for a workflow step in instance."""
    id: int
    step_key: str
    step_name: str
    role: Optional[str]
    assignment_type: AssignmentType
    approval_type: ApprovalType
    deadline_hours: Optional[int]
    order_index: int
    status: WorkflowStepStatus
    deadline: Optional[datetime]
    assigned_users: List[Dict[str, Any]] = []
    comments_count: int = 0
    is_delegated: bool

    class Config:
        from_attributes = True


class WorkflowInstanceResponse(BaseModel):
    """Response schema for workflow instance."""
    id: int
    template_id: int
    template_name: str
    document_id: Optional[int]
    document_revision: Optional[int]
    document_name: Optional[str]
    project_id: Optional[int]
    status: WorkflowStatus
    current_step_id: Optional[int]
    started_by: Optional[int]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    launch_comment: Optional[str]
    document_changed: bool
    created_at: datetime
    updated_at: datetime
    steps: List[WorkflowStepInstanceResponse] = []

    class Config:
        from_attributes = True


class WorkflowInstanceListResponse(BaseModel):
    """List of workflow instances."""
    instances: List[WorkflowInstanceResponse]
    total: int
    page: int
    page_size: int


# ============== Action Schemas ==============

class ApprovalAction(BaseModel):
    """Approve workflow step."""
    comment: Optional[str] = None
    delegate_to: Optional[int] = None  # Delegate to another user
    additional_files: Optional[List[str]] = Field(None, description="IDs прикрепленных файлов")


class RejectionAction(BaseModel):
    """Reject workflow step."""
    reason: str = Field(..., min_length=1, max_length=1000)
    return_to_author: bool = True
    additional_comments: Optional[str] = None


class DelegationAction(BaseModel):
    """Delegate workflow step."""
    delegate_to: int = Field(..., gt=0)
    reason: Optional[str] = None


# ============== Comment Schemas ==============

class WorkflowCommentCreate(BaseModel):
    """Create workflow comment."""
    text: str = Field(..., min_length=1, max_length=5000)
    page_number: Optional[int] = None
    coordinates: Optional[Dict[str, Any]] = None


class WorkflowCommentResponse(BaseModel):
    """Response for workflow comment."""
    id: int
    text: str
    page_number: Optional[int]
    coordinates: Optional[Dict[str, Any]]
    user_id: int
    user_name: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============== Audit Log Schemas ==============

class WorkflowAuditLogResponse(BaseModel):
    """Response for audit log entry."""
    id: int
    action: str
    old_status: Optional[str]
    new_status: Optional[str]
    comment: Optional[str]
    metadata: Optional[Dict[str, Any]]
    user_id: int
    user_name: str
    timestamp: datetime

    class Config:
        from_attributes = True


class WorkflowAuditLogListResponse(BaseModel):
    """List of audit log entries."""
    logs: List[WorkflowAuditLogResponse]
    total: int


# ============== Predefined Templates ==============

PREDEFINED_TEMPLATES = [
    {
        "name": "Стандартный",
        "code": "standard",
        "description": "Полный цикл согласования: Проектировщик → ГИП → Начальник отдела → Руководитель проекта → Отправка заказчику",
        "steps_schema": [
            {
                "id": "designer",
                "name": "Проектировщик",
                "role": "designer",
                "assignment_type": "any_of",
                "approval_type": "approve",
                "deadline_hours": 72,
                "auto_transition": {"on_approve": "next", "on_reject": "author"}
            },
            {
                "id": "chief_engineer",
                "name": "ГИП",
                "role": "chief_engineer",
                "assignment_type": "sequential",
                "approval_type": "approve",
                "deadline_hours": 48,
                "auto_transition": {"on_approve": "next", "on_reject": "designer"}
            },
            {
                "id": "department_head",
                "name": "Начальник отдела",
                "role": "department_head",
                "assignment_type": "sequential",
                "approval_type": "approve",
                "deadline_hours": 24,
                "auto_transition": {"on_approve": "next", "on_reject": "designer"}
            },
            {
                "id": "project_manager",
                "name": "Руководитель проекта",
                "role": "project_manager",
                "assignment_type": "sequential",
                "approval_type": "approve",
                "deadline_hours": 24,
                "auto_transition": {"on_approve": "next", "on_reject": "designer"}
            },
            {
                "id": "customer_send",
                "name": "Отправка заказчику",
                "role": "project_manager",
                "assignment_type": "sequential",
                "approval_type": "view_only",
                "deadline_hours": 8,
                "auto_transition": {"on_approve": "complete"}
            }
        ]
    },
    {
        "name": "Ускоренный",
        "code": "fast",
        "description": "Параллельное согласование: Проектировщик + ГИП параллельно → Руководитель проекта",
        "steps_schema": [
            {
                "id": "parallel_review",
                "name": "Проектировщик + ГИП (параллельно)",
                "role": None,
                "user_ids": [],
                "assignment_type": "parallel",
                "approval_type": "approve",
                "deadline_hours": 24,
                "auto_transition": {"on_approve": "next", "on_reject": "author"}
            },
            {
                "id": "project_manager",
                "name": "Руководитель проекта",
                "role": "project_manager",
                "assignment_type": "sequential",
                "approval_type": "approve",
                "deadline_hours": 12,
                "auto_transition": {"on_approve": "complete", "on_reject": "parallel_review"}
            }
        ]
    },
    {
        "name": "Тендерный",
        "code": "tender",
        "description": "Тендерный маршрут: Проектировщик → Тендерный отдел → Руководитель проекта",
        "steps_schema": [
            {
                "id": "designer",
                "name": "Проектировщик",
                "role": "designer",
                "assignment_type": "any_of",
                "approval_type": "approve",
                "deadline_hours": 48,
                "auto_transition": {"on_approve": "next", "on_reject": "author"}
            },
            {
                "id": "tender_dept",
                "name": "Тендерный отдел",
                "role": "tender",
                "assignment_type": "any_of",
                "approval_type": "approve",
                "deadline_hours": 24,
                "auto_transition": {"on_approve": "next", "on_reject": "designer"}
            },
            {
                "id": "project_manager",
                "name": "Руководитель проекта",
                "role": "project_manager",
                "assignment_type": "sequential",
                "approval_type": "approve",
                "deadline_hours": 12,
                "auto_transition": {"on_approve": "complete", "on_reject": "designer"}
            }
        ]
    }
]
