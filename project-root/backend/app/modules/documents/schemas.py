from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class DocumentBase(BaseModel):
    number: str
    name: str
    doc_type: str
    status: str = "draft"
    crs_code: Optional[str] = None


class DocumentCreate(DocumentBase):
    project_id: int
    stage_id: Optional[int] = None
    kit_id: Optional[int] = None
    section_id: Optional[int] = None
    author_id: int
    content: Optional[dict] = None
    variables_snapshot: Optional[dict] = None


class DocumentUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    crs_code: Optional[str] = None
    content: Optional[dict] = None
    variables_snapshot: Optional[dict] = None
    stage_id: Optional[int] = None
    kit_id: Optional[int] = None
    section_id: Optional[int] = None


class DocumentOut(DocumentBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    project_id: int
    stage_id: Optional[int] = None
    kit_id: Optional[int] = None
    section_id: Optional[int] = None
    author_id: int
    content: Optional[dict] = None
    variables_snapshot: Optional[dict] = None
    crs_approved_date: Optional[datetime] = None
    created_at: Optional[datetime] = None


# Document Dependency schemas

class DocumentDependencyBase(BaseModel):
    source_document_id: int
    target_document_id: int
    dependency_type: str = "FS"  # FS, SS, FF, SF
    lag_hours: int = 0


class DocumentDependencyCreate(DocumentDependencyBase):
    project_id: int


class DocumentDependencyUpdate(BaseModel):
    dependency_type: Optional[str] = None
    lag_hours: Optional[int] = None


class DocumentDependencyOut(DocumentDependencyBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    project_id: int


class DocumentNode(BaseModel):
    id: int
    number: str
    name: str
    doc_type: str
    status: str
    planned_start: Optional[datetime] = None
    planned_end: Optional[datetime] = None
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    duration_hours: Optional[float] = None


class DependencyEdge(BaseModel):
    id: int
    source: int
    target: int
    dependency_type: str
    lag_hours: int


class DependencyGraphOut(BaseModel):
    project_id: int
    nodes: List[DocumentNode]
    edges: List[DependencyEdge]


# Revision schemas
class RevisionBase(BaseModel):
    number: Optional[str] = None
    status: str = "draft"
    trigger_type: Optional[str] = None
    trigger_source_id: Optional[int] = None
    changes_summary: Optional[str] = None
    diff_before: Optional[dict] = None
    diff_after: Optional[dict] = None
    affected_variables: List[str] = []
    affected_documents: List[int] = []


class RevisionCreate(RevisionBase):
    document_id: int


class RevisionResponse(RevisionBase):
    id: int
    document_id: int
    created_by_id: int
    created_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


# Remark schemas
class RemarkBase(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: str = "minor"
    remark_type: str = "internal"
    category: str = "other"
    status: str = "new"
    deadline: Optional[datetime] = None
    target_page: Optional[int] = None
    target_coordinates: Optional[dict] = None
    target_element_id: Optional[str] = None
    target_text_selection: Optional[str] = None
    source_organization: Optional[str] = None
    source_department: Optional[str] = None
    resolution_action: Optional[str] = None
    response: Optional[str] = None
    confirmed_by_customer: Optional[bool] = None


class RemarkCreate(RemarkBase):
    document_id: int
    revision_id: Optional[int] = None


class RemarkUpdate(BaseModel):
    status: Optional[str] = None
    resolution_action: Optional[str] = None
    response: Optional[str] = None
    confirmed_by_customer: Optional[bool] = None


class RemarkResponse(RemarkBase):
    id: int
    document_id: int
    revision_id: Optional[int] = None
    source_author_id: int
    created_at: Optional[datetime] = None
    confirmed_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class RemarkListItem(BaseModel):
    id: int
    title: Optional[str] = None
    description: Optional[str] = None
    severity: str
    status: str
    remark_type: str
    category: str
    deadline: Optional[datetime] = None
    created_at: Optional[datetime] = None
    document_id: int
    document_number: Optional[str] = None
    document_name: Optional[str] = None
    project_id: Optional[int] = None
    
    model_config = ConfigDict(from_attributes=True)


# Approval workflow schemas
class ApprovalStageBase(BaseModel):
    stage_id: Optional[int] = None
    name: Optional[str] = None
    role: Optional[str] = None
    required: bool = True
    assigned_to_id: Optional[int] = None
    sla_hours: Optional[int] = None


class ApprovalStageCreate(ApprovalStageBase):
    pass


class ApprovalStageResponse(ApprovalStageBase):
    id: int
    workflow_id: int
    sort_order: int
    status: Optional[str] = None
    signed_by_id: Optional[int] = None
    signed_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class ApprovalWorkflowBase(BaseModel):
    revision_id: Optional[int] = None
    route_type: Optional[str] = None


class ApprovalWorkflowCreate(ApprovalWorkflowBase):
    document_id: int
    stages: List[ApprovalStageCreate]


class ApprovalWorkflowResponse(ApprovalWorkflowBase):
    id: int
    document_id: int
    status: str
    created_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


# Locking schemas
class DocumentLockResponse(BaseModel):
    document_id: int
    locked_by_id: Optional[int] = None
    locked_at: Optional[datetime] = None


# Render schemas
class DocumentRenderRequest(BaseModel):
    extra_variables: Optional[dict] = None


class DocumentRenderResponse(BaseModel):
    document_id: int
    rendered: str
    variables_snapshot: dict


# Cascade update schemas
class CascadeUpdateRequest(BaseModel):
    project_id: int
    changed_keys: List[str] = []


class CascadeUpdateResponse(BaseModel):
    affected_documents: int
    document_ids: List[int]
