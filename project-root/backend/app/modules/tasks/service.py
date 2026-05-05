"""Task service with production synchronization logic."""
from datetime import datetime, date, timezone
from typing import Optional, Sequence
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import and_, or_, select, func, case
from sqlalchemy.orm import joinedload

from app.core.enums import TaskType, TaskStatus, TaskPriority, OperationStatus, DocumentStatus
from app.modules.tasks.models import Task
from app.modules.tasks.dto import TaskCreate, TaskUpdate, TaskStatusUpdate, TaskFilters, TaskResponse, TaskStatistics
from app.modules.projects.models import Project
from app.modules.documents.models import Document
from app.modules.operations.models import Operation
from app.modules.routes.models import Route


class TaskService:
    """Task service with production synchronization."""
    
    # In-memory TTL cache for statistics (seconds)
    _STATS_CACHE_TTL = 30
    _stats_cache: dict = {}
    
    def __init__(self, db: AsyncSession):
        self.db = db

    def _task_query_with_relations(self):
        """Base query that eagerly loads all related entities."""
        return select(Task).options(
            joinedload(Task.assignee),
            joinedload(Task.creator),
            joinedload(Task.project),
            joinedload(Task.operation),
            joinedload(Task.document),
            joinedload(Task.work_center),
        )
    
    async def create_task(self, task_in: TaskCreate, creator_id: int) -> Task:
        """Create a new task."""
        db_task = Task(
            **task_in.model_dump(exclude_unset=True),
            creator_id=creator_id,
        )
        self.db.add(db_task)
        await self.db.commit()
        await self.db.refresh(db_task)
        # Reload with relations so task_to_response can populate names
        return await self.get_task(db_task.id)
    
    async def get_task(self, task_id: int) -> Optional[Task]:
        """Get task by ID with related entities loaded."""
        result = await self.db.execute(
            self._task_query_with_relations().where(Task.id == task_id)
        )
        return result.scalar_one_or_none()
    
    async def get_tasks(self, filters: TaskFilters, limit: int = 100, offset: int = 0) -> tuple[Sequence[Task], int]:
        """Get tasks with filters."""
        query = self._task_query_with_relations()
        
        # Apply filters
        if filters.project_id:
            query = query.where(Task.project_id == filters.project_id)
        if filters.assignee_id:
            query = query.where(Task.assignee_id == filters.assignee_id)
        if filters.status:
            query = query.where(Task.status == filters.status)
        if filters.type:
            query = query.where(Task.type == filters.type)
        if filters.priority:
            query = query.where(Task.priority == filters.priority)
        if filters.work_center_id:
            query = query.where(Task.work_center_id == filters.work_center_id)
        if filters.due_date_from:
            query = query.where(Task.due_date >= filters.due_date_from)
        if filters.due_date_to:
            query = query.where(Task.due_date <= filters.due_date_to)
        if filters.overdue_only:
            now = datetime.now(timezone.utc)
            query = query.where(
                and_(
                    Task.due_date < now,
                    Task.status.notin_([TaskStatus.DONE, TaskStatus.CANCELLED])
                )
            )
        if filters.search:
            search_pattern = f"%{filters.search}%"
            query = query.where(
                or_(
                    Task.title.ilike(search_pattern),
                    Task.description.ilike(search_pattern)
                )
            )
        
        # Get total count
        count_result = await self.db.execute(select(func.count()).select_from(query.subquery()))
        total = count_result.scalar() or 0
        
        # Apply pagination
        query = query.order_by(Task.due_date.nulls_last(), Task.created_at.desc()).limit(limit).offset(offset)
        result = await self.db.execute(query)
        tasks = result.scalars().all()
        
        return tasks, total
    
    async def update_task(self, task_id: int, task_in: TaskUpdate, current_user_id: int) -> Optional[Task]:
        """Update task with production synchronization."""
        task = await self.get_task(task_id)
        if not task:
            return None
        
        # Get old status for sync logic
        old_status = task.status
        
        # Update fields
        update_data = task_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(task, field, value)
        
        # Handle status change synchronization
        if 'status' in update_data and update_data['status'] != old_status:
            await self._sync_on_status_change(task, old_status, update_data['status'])
        
        task.updated_at = datetime.now(timezone.utc)
        await self.db.commit()
        await self.db.refresh(task)
        # Re-fetch with relations so response includes names
        return await self.get_task(task_id)
    
    async def update_task_status(self, task_id: int, status_in: TaskStatusUpdate) -> Optional[Task]:
        """Update task status with sync to production tables."""
        task = await self.get_task(task_id)
        if not task:
            return None
        
        old_status = task.status
        new_status = status_in.status
        
        # Update task
        task.status = new_status
        if status_in.percent_complete is not None:
            task.percent_complete = status_in.percent_complete
        task.updated_at = datetime.now(timezone.utc)
        
        # Sync with production tables
        await self._sync_on_status_change(task, old_status, new_status)
        
        await self.db.commit()
        await self.db.refresh(task)
        # Re-fetch with relations so response includes names
        return await self.get_task(task_id)
    
    async def delete_task(self, task_id: int) -> bool:
        """Delete a task."""
        task = await self.get_task(task_id)
        if not task:
            return False
        
        await self.db.delete(task)
        await self.db.commit()
        return True
    
    async def _sync_on_status_change(self, task: Task, old_status: TaskStatus, new_status: TaskStatus):
        """Synchronize task status change with production tables (operations, documents, projects).
        
        Business rules:
        1. production task in_progress -> operation.in_progress, set actual_start
        2. production task done -> operation.completed, set actual_finish, update project.forecast_finish
        3. document task overdue -> document.overdue
        4. Cancelled task -> rollback operation/document status if needed
        """
        now = datetime.now(timezone.utc)
        
        # Rule 1: Production task -> Operation sync
        if task.type == TaskType.PRODUCTION and task.operation_id:
            result = await self.db.execute(select(Operation).where(Operation.id == task.operation_id))
            operation = result.scalar_one_or_none()
            if operation:
                if new_status == TaskStatus.IN_PROGRESS and old_status != TaskStatus.IN_PROGRESS:
                    # Start operation
                    operation.status = OperationStatus.IN_PROGRESS
                    if not operation.actual_start:
                        operation.actual_start = now
                    if not task.started_at:
                        task.started_at = now
                
                elif new_status == TaskStatus.DONE and old_status != TaskStatus.DONE:
                    # Complete operation
                    operation.status = OperationStatus.COMPLETED
                    if not operation.actual_finish:
                        operation.actual_finish = now
                    if not task.completed_at:
                        task.completed_at = now
                    
                    # Update project forecast if this is a critical path operation
                    await self._update_project_forecast(operation)
                
                elif new_status == TaskStatus.CANCELLED and old_status != TaskStatus.CANCELLED:
                    # Cancel operation
                    operation.status = OperationStatus.CANCELLED
        
        # Rule 2: Document task -> Document sync
        elif task.type == TaskType.DOCUMENT and task.document_id:
            result = await self.db.execute(select(Document).where(Document.id == task.document_id))
            document = result.scalar_one_or_none()
            if document:
                if new_status == TaskStatus.DONE and old_status != TaskStatus.DONE:
                    # Mark document as ready
                    if not document.actual_ready:
                        document.actual_ready = now
                
                elif new_status == TaskStatus.ON_HOLD and old_status != TaskStatus.ON_HOLD:
                    # Pause document work
                    pass
                
                # Check for overdue (applies to any document task)
                if task.due_date and task.due_date < now and new_status != TaskStatus.DONE:
                    document.status = DocumentStatus.OVERDUE
        
        # Rule 3: Approval/Review task -> Document workflow sync
        elif task.type in [TaskType.APPROVAL, TaskType.REVIEW] and task.document_id:
            result = await self.db.execute(select(Document).where(Document.id == task.document_id))
            document = result.scalar_one_or_none()
            if document:
                if new_status == TaskStatus.DONE and old_status != TaskStatus.DONE:
                    # Update document approval status
                    if task.type == TaskType.APPROVAL:
                        # Could update document.approved_at, etc.
                        pass
                    elif task.type == TaskType.REVIEW:
                        # Could update document.reviewed_at, etc.
                        pass
    
    async def _update_project_forecast(self, operation: Operation):
        """Update project forecast finish based on operation completion."""
        if not operation.route_id:
            return
        
        # Load route with project relationship
        result = await self.db.execute(select(Route).where(Route.id == operation.route_id))
        route = result.scalar_one_or_none()
        if not route:
            return
        
        project = route.project
        if not project:
            return
        
        # Check if this is the last operation
        result = await self.db.execute(
            select(Operation)
            .where(Operation.route_id == operation.route_id)
            .order_by(Operation.sequence.desc())
            .limit(1)
        )
        route_operations = result.scalar_one_or_none()
        
        if route_operations and route_operations.id == operation.id:
            # This is the last operation, update project forecast
            if operation.actual_finish and (not project.forecast_finish or project.forecast_finish > operation.actual_finish):
                project.forecast_finish = operation.actual_finish
                self.db.add(project)
    
    async def get_statistics(self, project_id: Optional[int] = None) -> TaskStatistics:
        """Get task statistics for dashboard."""
        cache_key = f"stats:{project_id or 'all'}"
        cached = self._stats_cache.get(cache_key)
        if cached:
            result, expires_at = cached
            if datetime.now(timezone.utc).timestamp() < expires_at:
                return result
        
        base_query = select(Task)
        if project_id:
            base_query = base_query.where(Task.project_id == project_id)
        
        # Total
        total_result = await self.db.execute(select(func.count()).select_from(base_query.subquery()))
        total = total_result.scalar() or 0
        
        # By status
        by_status = {}
        for status in TaskStatus:
            count_result = await self.db.execute(
                select(func.count()).select_from(base_query.subquery()).where(Task.status == status)
            )
            count = count_result.scalar() or 0
            if count > 0:
                by_status[status.value] = count
        
        # By priority
        by_priority = {}
        for priority in TaskPriority:
            count_result = await self.db.execute(
                select(func.count()).select_from(base_query.subquery()).where(Task.priority == priority)
            )
            count = count_result.scalar() or 0
            if count > 0:
                by_priority[priority.value] = count
        
        # By type
        by_type = {}
        for task_type in TaskType:
            count_result = await self.db.execute(
                select(func.count()).select_from(base_query.subquery()).where(Task.type == task_type)
            )
            count = count_result.scalar() or 0
            if count > 0:
                by_type[task_type.value] = count
        
        # Overdue
        now = datetime.now(timezone.utc)
        overdue_result = await self.db.execute(
            select(func.count()).select_from(base_query.subquery()).where(
                and_(
                    Task.due_date < now,
                    Task.status.notin_([TaskStatus.DONE, TaskStatus.CANCELLED])
                )
            )
        )
        overdue_count = overdue_result.scalar() or 0
        overdue_percentage = (overdue_count / total * 100) if total > 0 else 0.0
        
        # Assignee load
        assignee_result = await self.db.execute(
            select(
                Task.assignee_id,
                func.count(Task.id).label('task_count'),
                func.sum(
                    case(
                        (
                            and_(
                                Task.due_date < now,
                                Task.status.notin_([TaskStatus.DONE, TaskStatus.CANCELLED])
                            ),
                            1
                        ),
                        else_=0
                    )
                ).label('overdue_count')
            )
            .select_from(base_query.subquery())
            .where(Task.assignee_id.isnot(None))
            .group_by(Task.assignee_id)
        )
        
        assignee_load = []
        for row in assignee_result.all():
            assignee_id, task_count, overdue_count_assignee = row
            if assignee_id:
                assignee_load.append({
                    'assignee_id': assignee_id,
                    'task_count': task_count,
                    'overdue_count': overdue_count_assignee
                })
        
        result = TaskStatistics(
            total=total,
            by_status=by_status,
            by_priority=by_priority,
            by_type=by_type,
            overdue_count=overdue_count,
            overdue_percentage=overdue_percentage,
            assignee_load=assignee_load
        )
        expires_at = datetime.now(timezone.utc).timestamp() + self._STATS_CACHE_TTL
        self._stats_cache[cache_key] = (result, expires_at)
        return result
    
    def task_to_response(self, task: Task) -> TaskResponse:
        """Convert task model to response DTO."""
        # Calculate overdue days
        overdue_days = None
        if task.due_date and task.status not in [TaskStatus.DONE, TaskStatus.CANCELLED]:
            now = datetime.now(timezone.utc)
            if task.due_date < now:
                overdue_days = (now - task.due_date).days
        
        return TaskResponse(
            id=task.id,
            title=task.title,
            description=task.description,
            type=task.type,
            status=task.status,
            priority=task.priority,
            due_date=task.due_date,
            started_at=task.started_at,
            completed_at=task.completed_at,
            assignee_id=task.assignee_id,
            creator_id=task.creator_id,
            project_id=task.project_id,
            route_id=task.route_id,
            operation_id=task.operation_id,
            document_id=task.document_id,
            work_center_id=task.work_center_id,
            estimated_hours=task.estimated_hours,
            actual_hours=task.actual_hours,
            percent_complete=task.percent_complete,
            metadata=task.task_data,
            created_at=task.created_at,
            updated_at=task.updated_at,
            # Related entity info (populated via joinedload)
            assignee_name=task.assignee.full_name if task.assignee else None,
            creator_name=task.creator.full_name if task.creator else None,
            project_code=task.project.code if task.project else None,
            project_name=task.project.name if task.project else None,
            operation_code=task.operation.code if task.operation else None,
            operation_name=task.operation.name if task.operation else None,
            document_number=task.document.number if task.document else None,
            work_center_name=task.work_center.name if task.work_center else None,
            overdue_days=overdue_days
        )
