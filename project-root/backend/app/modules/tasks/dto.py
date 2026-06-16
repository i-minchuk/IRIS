"""Task DTOs for API requests and responses."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from app.core.enums import TaskType, TaskStatus, TaskPriority


# === Create/Update ===
class TaskCreate(BaseModel):
    """Create a new task."""
    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    type: TaskType = TaskType.PRODUCTION
    priority: TaskPriority = TaskPriority.NORMAL
    due_date: Optional[datetime] = None
    assignee_id: Optional[int] = None
    project_id: Optional[int] = None
    route_id: Optional[int] = None
    operation_id: Optional[int] = None
    document_id: Optional[int] = None
    work_center_id: Optional[int] = None
    estimated_hours: Optional[float] = None
    metadata: Optional[dict] = None


class TaskUpdate(BaseModel):
    """Update task fields."""
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    type: Optional[TaskType] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[datetime] = None
    assignee_id: Optional[int] = None
    project_id: Optional[int] = None
    route_id: Optional[int] = None
    operation_id: Optional[int] = None
    document_id: Optional[int] = None
    work_center_id: Optional[int] = None
    estimated_hours: Optional[float] = None
    actual_hours: Optional[float] = None
    percent_complete: Optional[int] = Field(None, ge=0, le=100)
    metadata: Optional[dict] = None


class TaskStatusUpdate(BaseModel):
    """Update task status with sync to production tables."""
    status: TaskStatus
    percent_complete: Optional[int] = Field(None, ge=0, le=100)
    notes: Optional[str] = None


# === Response ===
class TaskResponse(BaseModel):
    """Task response with related entities."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: Optional[str] = None
    type: TaskType
    status: TaskStatus
    priority: TaskPriority
    due_date: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    assignee_id: Optional[int] = None
    assignee_name: Optional[str] = None
    creator_id: int
    creator_name: Optional[str] = None
    project_id: Optional[int] = None
    project_code: Optional[str] = None
    project_name: Optional[str] = None
    route_id: Optional[int] = None
    operation_id: Optional[int] = None
    operation_code: Optional[str] = None
    operation_name: Optional[str] = None
    document_id: Optional[int] = None
    document_number: Optional[str] = None
    work_center_id: Optional[int] = None
    work_center_name: Optional[str] = None
    estimated_hours: Optional[float] = None
    actual_hours: Optional[float] = None
    percent_complete: int = 0
    overdue_days: Optional[int] = None
    metadata: Optional[dict] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


# === Paginated List ===
class PaginatedTaskList(BaseModel):
    """Paginated list of tasks."""
    items: list[TaskResponse]
    total: int
    page: int
    page_size: int
    pages: int


# === Filtering ===
class TaskFilters(BaseModel):
    """Filters for task list."""
    project_id: Optional[int] = None
    project_code: Optional[str] = None
    assignee_id: Optional[int] = None
    status: Optional[TaskStatus] = None
    type: Optional[TaskType] = None
    priority: Optional[TaskPriority] = None
    work_center_id: Optional[int] = None
    due_date_from: Optional[datetime] = None
    due_date_to: Optional[datetime] = None
    overdue_only: bool = False
    search: Optional[str] = None


# === Summary/Statistics ===
class TaskStatistics(BaseModel):
    """Task statistics for dashboard."""
    total: int
    by_status: dict[str, int]
    by_priority: dict[str, int]
    by_type: dict[str, int]
    overdue_count: int
    overdue_percentage: float
    assignee_load: list[dict]
