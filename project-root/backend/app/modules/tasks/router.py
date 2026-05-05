"""Task API router."""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.db.session import get_db
from app.modules.auth.deps import get_current_active_user
from app.modules.auth.models import User
from app.modules.tasks.models import Task
from app.modules.tasks.service import TaskService
from app.modules.tasks.dto import (
    TaskCreate, TaskUpdate, TaskStatusUpdate,
    TaskFilters, TaskResponse, TaskStatistics
)

router = APIRouter(tags=["tasks"])


@router.get("", response_model=list[TaskResponse])
async def list_tasks(
    project_id: Optional[int] = Query(None, description="Filter by project ID"),
    assignee_id: Optional[int] = Query(None, description="Filter by assignee"),
    status: Optional[str] = Query(None, description="Filter by status"),
    type: Optional[str] = Query(None, description="Filter by type"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    work_center_id: Optional[int] = Query(None, description="Filter by work center"),
    due_date_from: Optional[str] = Query(None, description="Filter tasks due from this date"),
    due_date_to: Optional[str] = Query(None, description="Filter tasks due up to this date"),
    overdue_only: bool = Query(False, description="Show only overdue tasks"),
    search: Optional[str] = Query(None, description="Search in title/description"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get list of tasks with filters."""
    from datetime import datetime
    
    # Build filters
    filters = TaskFilters(
        project_id=project_id,
        assignee_id=assignee_id,
        status=status,
        type=type,
        priority=priority,
        work_center_id=work_center_id,
        due_date_from=datetime.fromisoformat(due_date_from) if due_date_from else None,
        due_date_to=datetime.fromisoformat(due_date_to) if due_date_to else None,
        overdue_only=overdue_only,
        search=search
    )
    
    service = TaskService(db)
    tasks, total = await service.get_tasks(filters, limit, offset)
    
    return [service.task_to_response(task) for task in tasks]


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_in: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new task."""
    service = TaskService(db)
    task = await service.create_task(task_in, current_user.id)
    return service.task_to_response(task)


@router.get("/statistics", response_model=TaskStatistics)
async def get_task_statistics(
    project_id: Optional[int] = Query(None, description="Statistics for specific project"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get task statistics for dashboard."""
    service = TaskService(db)
    return await service.get_statistics(project_id)


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get task by ID."""
    service = TaskService(db)
    task = await service.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return service.task_to_response(task)


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_in: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update task."""
    service = TaskService(db)
    task = await service.update_task(task_id, task_in, current_user.id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return service.task_to_response(task)


@router.patch("/{task_id}/status", response_model=TaskResponse)
async def update_task_status(
    task_id: int,
    status_in: TaskStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update task status with production synchronization."""
    service = TaskService(db)
    task = await service.update_task_status(task_id, status_in)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return service.task_to_response(task)


@router.delete("/{task_id}")
async def delete_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a task."""
    service = TaskService(db)
    success = await service.delete_task(task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"ok": True}
