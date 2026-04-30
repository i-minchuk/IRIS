"""Task service with production synchronization logic."""
from datetime import datetime, date
from typing import Optional, Sequence
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.core.enums import TaskType, TaskStatus, TaskPriority, OperationStatus, DocumentStatus
from app.modules.tasks.models import Task
from app.modules.tasks.dto import TaskCreate, TaskUpdate, TaskStatusUpdate, TaskFilters, TaskResponse, TaskStatistics
from app.modules.projects.models import Project
from app.modules.documents.models import Document
from app.modules.operations.models import Operation  # Будет создано
from app.modules.routes.models import Route  # Будет создано


class TaskService:
    """Task service with production synchronization."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_task(self, task_in: TaskCreate, creator_id: int) -> Task:
        """Create a new task."""
        db_task = Task(
            **task_in.model_dump(exclude_unset=True),
            creator_id=creator_id,
        )
        self.db.add(db_task)
        self.db.commit()
        self.db.refresh(db_task)
        return db_task
    
    def get_task(self, task_id: int) -> Optional[Task]:
        """Get task by ID."""
        return self.db.query(Task).filter(Task.id == task_id).first()
    
    def get_tasks(self, filters: TaskFilters, limit: int = 100, offset: int = 0) -> tuple[Sequence[Task], int]:
        """Get tasks with filters."""
        query = self.db.query(Task)
        
        # Apply filters
        if filters.project_id:
            query = query.filter(Task.project_id == filters.project_id)
        if filters.assignee_id:
            query = query.filter(Task.assignee_id == filters.assignee_id)
        if filters.status:
            query = query.filter(Task.status == filters.status)
        if filters.type:
            query = query.filter(Task.type == filters.type)
        if filters.priority:
            query = query.filter(Task.priority == filters.priority)
        if filters.work_center_id:
            query = query.filter(Task.work_center_id == filters.work_center_id)
        if filters.due_date_from:
            query = query.filter(Task.due_date >= filters.due_date_from)
        if filters.due_date_to:
            query = query.filter(Task.due_date <= filters.due_date_to)
        if filters.overdue_only:
            now = datetime.utcnow()
            query = query.filter(
                and_(
                    Task.due_date < now,
                    Task.status.notin_([TaskStatus.DONE, TaskStatus.CANCELLED])
                )
            )
        if filters.search:
            search_pattern = f"%{filters.search}%"
            query = query.filter(
                or_(
                    Task.title.ilike(search_pattern),
                    Task.description.ilike(search_pattern)
                )
            )
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        tasks = query.order_by(Task.due_date.nulls_last(), Task.created_at.desc()).limit(limit).offset(offset).all()
        
        return tasks, total
    
    def update_task(self, task_id: int, task_in: TaskUpdate, current_user_id: int) -> Optional[Task]:
        """Update task with production synchronization."""
        task = self.get_task(task_id)
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
            self._sync_on_status_change(task, old_status, update_data['status'])
        
        task.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(task)
        return task
    
    def update_task_status(self, task_id: int, status_in: TaskStatusUpdate) -> Optional[Task]:
        """Update task status with sync to production tables."""
        task = self.get_task(task_id)
        if not task:
            return None
        
        old_status = task.status
        new_status = status_in.status
        
        # Update task
        task.status = new_status
        if status_in.percent_complete is not None:
            task.percent_complete = status_in.percent_complete
        task.updated_at = datetime.utcnow()
        
        # Sync with production tables
        self._sync_on_status_change(task, old_status, new_status)
        
        self.db.commit()
        self.db.refresh(task)
        return task
    
    def delete_task(self, task_id: int) -> bool:
        """Delete a task."""
        task = self.get_task(task_id)
        if not task:
            return False
        
        self.db.delete(task)
        self.db.commit()
        return True
    
    def _sync_on_status_change(self, task: Task, old_status: TaskStatus, new_status: TaskStatus):
        """Synchronize task status change with production tables (operations, documents, projects).
        
        Business rules:
        1. production task in_progress -> operation.in_progress, set actual_start
        2. production task done -> operation.completed, set actual_finish, update project.forecast_finish
        3. document task overdue -> document.overdue
        4. Cancelled task -> rollback operation/document status if needed
        """
        now = datetime.utcnow()
        
        # Rule 1: Production task -> Operation sync
        if task.type == TaskType.PRODUCTION and task.operation_id:
            operation = self.db.query(Operation).filter(Operation.id == task.operation_id).first()
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
                    self._update_project_forecast(operation)
                
                elif new_status == TaskStatus.CANCELLED and old_status != TaskStatus.CANCELLED:
                    # Cancel operation
                    operation.status = OperationStatus.CANCELLED
        
        # Rule 2: Document task -> Document sync
        elif task.type == TaskType.DOCUMENT and task.document_id:
            document = self.db.query(Document).filter(Document.id == task.document_id).first()
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
            document = self.db.query(Document).filter(Document.id == task.document_id).first()
            if document:
                if new_status == TaskStatus.DONE and old_status != TaskStatus.DONE:
                    # Update document approval status
                    if task.type == TaskType.APPROVAL:
                        # Could update document.approved_at, etc.
                        pass
                    elif task.type == TaskType.REVIEW:
                        # Could update document.reviewed_at, etc.
                        pass
    
    def _update_project_forecast(self, operation: 'Operation'):
        """Update project forecast finish based on operation completion."""
        if not operation.route_id or not operation.route:
            return
        
        project = operation.route.project
        if not project:
            return
        
        # Check if this is the last operation
        route_operations = self.db.query(Operation).filter(
            Operation.route_id == operation.route_id
        ).order_by(Operation.sequence.desc()).first()
        
        if route_operations and route_operations.id == operation.id:
            # This is the last operation, update project forecast
            if operation.actual_finish and (not project.forecast_finish or project.forecast_finish > operation.actual_finish):
                project.forecast_finish = operation.actual_finish
                self.db.add(project)
    
    def get_statistics(self, project_id: Optional[int] = None) -> TaskStatistics:
        """Get task statistics for dashboard."""
        query = self.db.query(Task)
        if project_id:
            query = query.filter(Task.project_id == project_id)
        
        total = query.count()
        
        # By status
        by_status = {}
        for status in TaskStatus:
            count = query.filter(Task.status == status).count()
            if count > 0:
                by_status[status.value] = count
        
        # By priority
        by_priority = {}
        for priority in TaskPriority:
            count = query.filter(Task.priority == priority).count()
            if count > 0:
                by_priority[priority.value] = count
        
        # By type
        by_type = {}
        for task_type in TaskType:
            count = query.filter(Task.type == task_type).count()
            if count > 0:
                by_type[task_type.value] = count
        
        # Overdue
        now = datetime.utcnow()
        overdue_query = query.filter(
            and_(
                Task.due_date < now,
                Task.status.notin_([TaskStatus.DONE, TaskStatus.CANCELLED])
            )
        )
        overdue_count = overdue_query.count()
        overdue_percentage = (overdue_count / total * 100) if total > 0 else 0.0
        
        # Assignee load
        from sqlalchemy import func
        assignee_query = query.with_entities(
            Task.assignee_id,
            func.count(Task.id).label('task_count'),
            func.sum(
                func.case(
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
        ).group_by(Task.assignee_id).all()
        
        assignee_load = []
        for assignee_id, task_count, overdue_count_assignee in assignee_query:
            if assignee_id:
                assignee_load.append({
                    'assignee_id': assignee_id,
                    'task_count': task_count,
                    'overdue_count': overdue_count_assignee
                })
        
        return TaskStatistics(
            total=total,
            by_status=by_status,
            by_priority=by_priority,
            by_type=by_type,
            overdue_count=overdue_count,
            overdue_percentage=overdue_percentage,
            assignee_load=assignee_load
        )
    
    def task_to_response(self, task: Task) -> TaskResponse:
        """Convert task model to response DTO."""
        # Calculate overdue days
        overdue_days = None
        if task.due_date and task.status not in [TaskStatus.DONE, TaskStatus.CANCELLED]:
            now = datetime.utcnow()
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
            # Related entity info (would be populated via join in real implementation)
            assignee_name=None,
            creator_name=None,
            project_code=None,
            project_name=None,
            operation_code=None,
            operation_name=None,
            document_number=None,
            work_center_name=None,
            overdue_days=overdue_days
        )
