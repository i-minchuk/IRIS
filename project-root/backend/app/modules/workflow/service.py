"""Workflow service - business logic for approval routing."""
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.exc import SQLAlchemyError
import logging

from app.modules.workflow.models import (
    WorkflowTemplate, WorkflowInstance, WorkflowStep,
    WorkflowStatus, WorkflowStepStatus, ApprovalType, AssignmentType,
    WorkflowComment, WorkflowAuditLog
)
from app.modules.workflow.schemas import (
    WorkflowTemplateCreate, WorkflowTemplateUpdate,
    WorkflowInstanceCreate, ApprovalAction, RejectionAction, DelegationAction
)
from app.modules.auth.models import User

logger = logging.getLogger(__name__)


class WorkflowServiceError(Exception):
    """Base exception for workflow service."""
    pass


class WorkflowNotFoundError(WorkflowServiceError):
    """Workflow template not found."""
    pass


class InstanceNotFoundError(WorkflowServiceError):
    """Workflow instance not found."""
    pass


class StepNotFoundError(WorkflowServiceError):
    """Workflow step not found."""
    pass


class WorkflowService:
    """Service for workflow management."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # ==================== Template Methods ====================

    async def create_template(
        self,
        template_data: WorkflowTemplateCreate,
        created_by: Optional[int] = None
    ) -> WorkflowTemplate:
        """Create a new workflow template."""
        try:
            template = WorkflowTemplate(
                name=template_data.name,
                code=template_data.code,
                description=template_data.description,
                steps_schema=[s.model_dump() for s in template_data.steps_schema],
                is_default=template_data.is_default,
                created_by=created_by
            )
            
            self.db.add(template)
            await self.db.commit()
            await self.db.refresh(template)
            
            logger.info(f"Workflow template created: {template.id} ({template.code})")
            return template
            
        except SQLAlchemyError as e:
            await self.db.rollback()
            logger.error(f"Error creating workflow template: {e}")
            raise WorkflowServiceError(f"Failed to create template: {e}")

    async def get_template(self, template_id: int) -> Optional[WorkflowTemplate]:
        """Get workflow template by ID."""
        result = await self.db.execute(
            select(WorkflowTemplate).where(WorkflowTemplate.id == template_id)
        )
        return result.scalar_one_or_none()

    async def get_templates(
        self,
        active_only: bool = True,
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[WorkflowTemplate], int]:
        """Get all workflow templates with pagination."""
        query = select(WorkflowTemplate)
        
        if active_only:
            query = query.where(WorkflowTemplate.is_active == True)
        
        query = query.order_by(WorkflowTemplate.created_at.desc())
        
        total_result = await self.db.execute(select(func.count()).select_from(query.subquery()))
        total = total_result.scalar() or 0
        
        query = query.offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(query)
        templates = result.scalars().all()
        
        return list(templates), total

    async def update_template(
        self,
        template_id: int,
        update_data: WorkflowTemplateUpdate
    ) -> Optional[WorkflowTemplate]:
        """Update workflow template."""
        template = await self.get_template(template_id)
        if not template:
            return None
        
        update_dict = update_data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(template, key, value)
        
        template.updated_at = datetime.utcnow()
        
        try:
            await self.db.commit()
            await self.db.refresh(template)
            return template
        except SQLAlchemyError as e:
            await self.db.rollback()
            logger.error(f"Error updating template: {e}")
            raise WorkflowServiceError(f"Failed to update template: {e}")

    async def delete_template(self, template_id: int) -> bool:
        """Soft delete workflow template."""
        template = await self.get_template(template_id)
        if not template:
            return False
        
        template.is_active = False
        try:
            await self.db.commit()
            return True
        except SQLAlchemyError as e:
            await self.db.rollback()
            raise WorkflowServiceError(f"Failed to delete template: {e}")

    # ==================== Instance Methods ====================

    async def create_instance(
        self,
        instance_data: WorkflowInstanceCreate,
        started_by: Optional[int] = None
    ) -> WorkflowInstance:
        """Create and start a new workflow instance from template."""
        template = await self.get_template(instance_data.template_id)
        if not template:
            raise WorkflowNotFoundError(f"Template {instance_data.template_id} not found")
        
        instance = WorkflowInstance(
            template_id=template.id,
            document_id=instance_data.document_id,
            document_revision=instance_data.document_revision,
            document_name=instance_data.document_name,
            project_id=instance_data.project_id,
            launch_comment=instance_data.launch_comment,
            started_by=started_by,
            status=WorkflowStatus.RUNNING,
            started_at=datetime.utcnow()
        )
        
        self.db.add(instance)
        await self.db.flush()  # Get instance ID
        
        # Create steps from template schema
        steps_data = template.steps_schema or []
        prev_step_id = None
        
        for idx, step_schema in enumerate(steps_data):
            step = WorkflowStep(
                instance_id=instance.id,
                step_key=step_schema.get('id', f'step_{idx}'),
                step_name=step_schema.get('name', f'Шаг {idx + 1}'),
                role=step_schema.get('role'),
                assignment_type=AssignmentType(step_schema.get('assignment_type', 'sequential')),
                approval_type=ApprovalType(step_schema.get('approval_type', 'approve')),
                deadline_hours=step_schema.get('deadline_hours'),
                order_index=idx,
                auto_transition=step_schema.get('auto_transition'),
                status=WorkflowStepStatus.PENDING if idx == 0 else WorkflowStepStatus.PENDING
            )
            
            if step_schema.get('user_ids'):
                for user_id in step_schema['user_ids']:
                    assignee = await self.db.get(User, user_id)
                    if assignee:
                        step.assignees.append(assignee)
            
            self.db.add(step)
            
            if idx == 0:
                instance.current_step_id = step.id
        
        try:
            await self.db.commit()
            await self.db.refresh(instance)
            await self.db.refresh(instance, ['steps'])
            
            # Create audit log
            audit = WorkflowAuditLog(
                instance_id=instance.id,
                user_id=started_by,
                action='started',
                old_status=None,
                new_status=WorkflowStatus.RUNNING.value,
                comment=instance_data.launch_comment,
                timestamp=datetime.utcnow()
            )
            self.db.add(audit)
            await self.db.commit()
            
            logger.info(f"Workflow instance created: {instance.id}")
            return instance
            
        except SQLAlchemyError as e:
            await self.db.rollback()
            logger.error(f"Error creating instance: {e}")
            raise WorkflowServiceError(f"Failed to create instance: {e}")

    async def get_instance(self, instance_id: int) -> Optional[WorkflowInstance]:
        """Get workflow instance by ID."""
        result = await self.db.execute(
            select(WorkflowInstance)
            .where(WorkflowInstance.id == instance_id)
            .options(
                # Eager load steps
            )
        )
        instance = result.scalar_one_or_none()
        
        if instance:
            # Load steps
            steps_result = await self.db.execute(
                select(WorkflowStep)
                .where(WorkflowStep.instance_id == instance_id)
                .order_by(WorkflowStep.order_index)
            )
            instance.steps_list = steps_result.scalars().all()
        
        return instance

    async def get_instances_by_document(
        self,
        document_id: int,
        active_only: bool = True
    ) -> List[WorkflowInstance]:
        """Get workflow instances for a document."""
        query = select(WorkflowInstance).where(WorkflowInstance.document_id == document_id)
        
        if active_only:
            query = query.where(
                WorkflowStatus.IN(WorkflowStatus.RUNNING, WorkflowStatus.PAUSED)
            )
        
        result = await self.db.execute(query.order_by(WorkflowInstance.created_at.desc()))
        return result.scalars().all()

    # ==================== Step Action Methods ====================

    async def approve_step(
        self,
        step_id: int,
        user_id: int,
        action: ApprovalAction
    ) -> Tuple[WorkflowStep, Optional[WorkflowStep]]:
        """Approve current step and return next step if any."""
        step = await self.db.get(WorkflowStep, step_id)
        if not step:
            raise StepNotFoundError(f"Step {step_id} not found")
        
        if step.status != WorkflowStepStatus.IN_PROGRESS:
            raise WorkflowServiceError("Step is not in progress")
        
        # Update step
        step.status = WorkflowStepStatus.APPROVED
        step.completed_by = user_id
        step.completed_at = datetime.utcnow()
        
        instance = await self.db.get(WorkflowInstance, step.instance_id)
        
        # Create audit log
        audit = WorkflowAuditLog(
            step_id=step_id,
            instance_id=step.instance_id,
            user_id=user_id,
            action='approved',
            old_status=WorkflowStepStatus.IN_PROGRESS.value,
            new_status=WorkflowStepStatus.APPROVED.value,
            comment=action.comment,
            timestamp=datetime.utcnow()
        )
        self.db.add(audit)
        
        # Determine next step
        next_step = await self._determine_next_step(step, instance)
        
        try:
            await self.db.commit()
            await self.db.refresh(step)
            if next_step:
                await self.db.refresh(next_step)
            return step, next_step
        except SQLAlchemyError as e:
            await self.db.rollback()
            raise WorkflowServiceError(f"Failed to approve step: {e}")

    async def reject_step(
        self,
        step_id: int,
        user_id: int,
        action: RejectionAction
    ) -> Optional[WorkflowStep]:
        """Reject step and return step to return to."""
        step = await self.db.get(WorkflowStep, step_id)
        if not step:
            raise StepNotFoundError(f"Step {step_id} not found")
        
        instance = await self.db.get(WorkflowInstance, step.instance_id)
        
        # Update step
        step.status = WorkflowStepStatus.REJECTED
        step.completed_by = user_id
        step.completed_at = datetime.utcnow()
        
        # Create audit log
        audit = WorkflowAuditLog(
            step_id=step_id,
            instance_id=step.instance_id,
            user_id=user_id,
            action='rejected',
            old_status=WorkflowStepStatus.IN_PROGRESS.value,
            new_status=WorkflowStepStatus.REJECTED.value,
            comment=action.reason,
            audit_metadata={"return_to_author": action.return_to_author},
            timestamp=datetime.utcnow()
        )
        self.db.add(audit)
        
        # Determine where to return
        return_step = None
        if action.return_to_author:
            # Return to first step
            steps_result = await self.db.execute(
                select(WorkflowStep)
                .where(WorkflowStep.instance_id == step.instance_id)
                .order_by(WorkflowStep.order_index.asc())
                .limit(1)
            )
            return_step = steps_result.scalar_one_or_none()
        else:
            return_step = step  # Stay at current step
        
        # Update instance status
        instance.status = WorkflowStatus.PAUSED
        instance.current_step_id = return_step.id if return_step else None
        
        try:
            await self.db.commit()
            if return_step:
                await self.db.refresh(return_step)
            return return_step
        except SQLAlchemyError as e:
            await self.db.rollback()
            raise WorkflowServiceError(f"Failed to reject step: {e}")

    async def delegate_step(
        self,
        step_id: int,
        user_id: int,
        action: DelegationAction
    ) -> WorkflowStep:
        """Delegate step to another user."""
        step = await self.db.get(WorkflowStep, step_id)
        if not step:
            raise StepNotFoundError(f"Step {step_id} not found")
        
        delegatee = await self.db.get(User, action.delegate_to)
        if not delegatee:
            raise WorkflowServiceError(f"User {action.delegate_to} not found")
        
        # Update step
        step.is_delegated = True
        step.status = WorkflowStepStatus.DELEGATED
        
        # Create audit log
        audit = WorkflowAuditLog(
            step_id=step_id,
            instance_id=step.instance_id,
            user_id=user_id,
            action='delegated',
            old_status=step.status.value,
            new_status=WorkflowStepStatus.DELEGATED.value,
            comment=action.reason,
            audit_metadata={"delegated_to": action.delegate_to},
            timestamp=datetime.utcnow()
        )
        self.db.add(audit)
        
        # Add delegatee to assignees
        if delegatee not in step.assignees:
            step.assignees.append(delegatee)
        
        try:
            await self.db.commit()
            await self.db.refresh(step)
            return step
        except SQLAlchemyError as e:
            await self.db.rollback()
            raise WorkflowServiceError(f"Failed to delegate step: {e}")

    # ==================== Helper Methods ====================

    async def _determine_next_step(
        self,
        current_step: WorkflowStep,
        instance: WorkflowInstance
    ) -> Optional[WorkflowStep]:
        """Determine the next step based on auto_transition rules."""
        auto_transition = current_step.auto_transition or {}
        
        if auto_transition.get('on_approve') == 'complete':
            # Complete the workflow
            instance.status = WorkflowStatus.COMPLETED
            instance.completed_at = datetime.utcnow()
            return None
        
        # Find next step
        next_order = current_step.order_index + 1
        result = await self.db.execute(
            select(WorkflowStep)
            .where(
                WorkflowStep.instance_id == instance.id,
                WorkflowStep.order_index == next_order
            )
        )
        next_step = result.scalar_one_or_none()
        
        if next_step:
            # Start next step
            next_step.status = WorkflowStepStatus.IN_PROGRESS
            next_step.assigned_at = datetime.utcnow()
            instance.current_step_id = next_step.id
            
            # Create audit log for next step
            audit = WorkflowAuditLog(
                step_id=next_step.id,
                instance_id=instance.id,
                user_id=None,
                action='auto_assigned',
                old_status=None,
                new_status=WorkflowStepStatus.IN_PROGRESS.value,
                timestamp=datetime.utcnow()
            )
            self.db.add(audit)
        else:
            # No more steps - complete workflow
            instance.status = WorkflowStatus.COMPLETED
            instance.completed_at = datetime.utcnow()
        
        return next_step

    async def create_comment(
        self,
        step_id: int,
        user_id: int,
        text: str,
        page_number: Optional[int] = None,
        coordinates: Optional[Dict[str, Any]] = None
    ) -> WorkflowComment:
        """Create a comment on a workflow step."""
        comment = WorkflowComment(
            step_id=step_id,
            user_id=user_id,
            text=text,
            page_number=page_number,
            coordinates=coordinates
        )
        
        self.db.add(comment)
        await self.db.commit()
        await self.db.refresh(comment)
        return comment

    async def get_audit_log(self, instance_id: int) -> List[WorkflowAuditLog]:
        """Get audit log for workflow instance."""
        result = await self.db.execute(
            select(WorkflowAuditLog)
            .where(WorkflowAuditLog.instance_id == instance_id)
            .order_by(WorkflowAuditLog.timestamp.asc())
        )
        return result.scalars().all()
