"""Workflow service - business logic for approval routing."""
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime, timedelta, timezone
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
from app.modules.workflow.notifications import (
    notify_workflow_started,
    notify_step_approved,
    notify_step_rejected,
    notify_step_delegated,
)

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

    async def get_template_by_code(self, code: str) -> Optional[WorkflowTemplate]:
        """Get workflow template by code."""
        result = await self.db.execute(
            select(WorkflowTemplate).where(WorkflowTemplate.code == code)
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
        
        template.updated_at = datetime.now(timezone.utc)
        
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
            started_at=datetime.now(timezone.utc)
        )
        
        self.db.add(instance)
        await self.db.flush()  # Get instance ID
        
        # Create steps from template schema
        steps_data = template.steps_schema or []
        first_step = None

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
                # Первый шаг активен сразу — иначе согласование встанет (approve требует in_progress)
                status=WorkflowStepStatus.IN_PROGRESS if idx == 0 else WorkflowStepStatus.PENDING,
                assigned_at=datetime.now(timezone.utc) if idx == 0 else None,
            )

            # Исполнители: явный список user_ids, иначе — все активные пользователи с ролью шага
            user_ids = step_schema.get('user_ids') or []
            if not user_ids and step_schema.get('role'):
                role_result = await self.db.execute(
                    select(User).where(
                        User.role == step_schema['role'],
                        User.is_active.is_(True),
                    )
                )
                for role_user in role_result.scalars().all():
                    step.assignees.append(role_user)
            else:
                for user_id in user_ids:
                    assignee = await self.db.get(User, user_id)
                    if assignee:
                        step.assignees.append(assignee)

            self.db.add(step)
            await self.db.flush()  # чтобы получить step.id
            if idx == 0:
                first_step = step

        if first_step:
            instance.current_step_id = first_step.id
        
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
                timestamp=datetime.now(timezone.utc)
            )
            self.db.add(audit)
            await self.db.commit()
            
            # Notify assignees of first step
            from sqlalchemy import select as _select
            steps_result = await self.db.execute(
                _select(WorkflowStep)
                .where(WorkflowStep.instance_id == instance.id)
                .order_by(WorkflowStep.order_index.asc())
            )
            all_steps = steps_result.scalars().all()
            first_step = all_steps[0] if all_steps else None
            if first_step:
                try:
                    await notify_workflow_started(self.db, instance, first_step)
                except Exception as e:
                    logger.warning(f"Failed to send workflow start notification: {e}")
            
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

    async def get_instances(
        self,
        status: Optional[str] = None,
        document_id: Optional[int] = None,
        project_id: Optional[int] = None,
        assigned_to: Optional[int] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[WorkflowInstance], int]:
        """Get workflow instances with filters."""
        query = select(WorkflowInstance)

        if status:
            query = query.where(WorkflowInstance.status == status)
        if document_id:
            query = query.where(WorkflowInstance.document_id == document_id)
        if project_id:
            query = query.where(WorkflowInstance.project_id == project_id)
        if assigned_to:
            query = (
                query.join(WorkflowStep, WorkflowInstance.id == WorkflowStep.instance_id)
                .join(workflow_step_assignees, WorkflowStep.id == workflow_step_assignees.c.step_id)
                .where(
                    WorkflowStep.status.in_([WorkflowStepStatus.PENDING, WorkflowStepStatus.IN_PROGRESS]),
                    workflow_step_assignees.c.user_id == assigned_to
                )
                .distinct()
            )

        total_result = await self.db.execute(select(func.count()).select_from(query.subquery()))
        total = total_result.scalar() or 0

        query = query.order_by(WorkflowInstance.created_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)

        result = await self.db.execute(query)
        instances = result.scalars().all()

        return list(instances), total

    async def get_instances_by_document(
        self,
        document_id: int,
        active_only: bool = True
    ) -> List[WorkflowInstance]:
        """Get workflow instances for a document."""
        query = select(WorkflowInstance).where(WorkflowInstance.document_id == document_id)
        
        if active_only:
            query = query.where(
                WorkflowInstance.status.in_([WorkflowStatus.RUNNING, WorkflowStatus.PAUSED])
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
        step.completed_at = datetime.now(timezone.utc)
        
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
            timestamp=datetime.now(timezone.utc)
        )
        self.db.add(audit)
        
        # Determine next step
        next_step = await self._determine_next_step(step, instance, user_id)
        
        try:
            await self.db.commit()
            await self.db.refresh(step)
            if next_step:
                await self.db.refresh(next_step)
            
            # Notify next step assignees or completer
            try:
                await notify_step_approved(self.db, step, next_step, instance)
            except Exception as e:
                logger.warning(f"Failed to send approval notification: {e}")
            
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
        step.completed_at = datetime.now(timezone.utc)
        
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
            timestamp=datetime.now(timezone.utc)
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

        # Шаг, к которому возвращаемся, должен стать активным — иначе согласовать его нельзя
        if return_step:
            return_step.status = WorkflowStepStatus.IN_PROGRESS
            return_step.assigned_at = datetime.now(timezone.utc)
            return_step.completed_by = None
            return_step.completed_at = None
            if return_step.id == step.id:
                # Переоткрываем отклонённый шаг для доработки
                step.status = WorkflowStepStatus.IN_PROGRESS
                step.completed_by = None
                step.completed_at = None

        # Update instance status
        instance.status = WorkflowStatus.RUNNING if return_step else WorkflowStatus.PAUSED
        instance.current_step_id = return_step.id if return_step else None
        
        try:
            await self.db.commit()
            if return_step:
                await self.db.refresh(return_step)
            
            # Notify starter and return step assignees
            try:
                await notify_step_rejected(self.db, step, return_step, instance, action.reason)
            except Exception as e:
                logger.warning(f"Failed to send rejection notification: {e}")
            
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
        
        old_status = step.status

        # Update step: делегат добавляется к исполнителям, шаг остаётся активным —
        # иначе делегат не сможет его согласовать (approve требует in_progress)
        step.is_delegated = True
        
        # Create audit log
        audit = WorkflowAuditLog(
            step_id=step_id,
            instance_id=step.instance_id,
            user_id=user_id,
            action='delegated',
            old_status=old_status.value,
            new_status=old_status.value,
            comment=action.reason,
            audit_metadata={"delegated_to": action.delegate_to},
            timestamp=datetime.now(timezone.utc)
        )
        self.db.add(audit)
        
        # Add delegatee to assignees (явная async-загрузка связи)
        await self.db.refresh(step, ["assignees"])
        if delegatee not in step.assignees:
            step.assignees.append(delegatee)

        instance = await self.db.get(WorkflowInstance, step.instance_id)
        
        try:
            await self.db.commit()
            await self.db.refresh(step)
            
            # Notify delegatee
            try:
                await notify_step_delegated(self.db, step, delegatee, instance, action.reason)
            except Exception as e:
                logger.warning(f"Failed to send delegation notification: {e}")
            
            return step
        except SQLAlchemyError as e:
            await self.db.rollback()
            raise WorkflowServiceError(f"Failed to delegate step: {e}")

    # ==================== Signature Methods ====================

    async def sign_and_approve_step(
        self,
        step_id: int,
        user_id: int,
        action: 'SignAction'
    ) -> Tuple[WorkflowStep, Optional[WorkflowStep], str]:
        """Create a signature record and approve the step."""
        import hashlib
        import os

        step = await self.db.get(WorkflowStep, step_id)
        if not step:
            raise StepNotFoundError(f"Step {step_id} not found")
        
        if step.status != WorkflowStepStatus.IN_PROGRESS:
            raise WorkflowServiceError("Step is not in progress")
        
        user = await self.db.get(User, user_id)
        if not user:
            raise WorkflowServiceError(f"User {user_id} not found")
        
        # Generate signature hash
        secret_salt = os.environ.get('SIGNATURE_SALT', 'iris-workflow-salt-v1')
        timestamp = datetime.now(timezone.utc).isoformat()
        hash_input = f"{step_id}:{user_id}:{timestamp}:{secret_salt}"
        signature_hash = hashlib.sha256(hash_input.encode()).hexdigest()
        
        # Create signature record
        from app.modules.workflow.models import WorkflowSignature
        signature = WorkflowSignature(
            step_id=step_id,
            user_id=user_id,
            signature_hash=signature_hash,
            ip_address=action.ip_address,
            user_agent=action.user_agent,
            signed_at=datetime.now(timezone.utc)
        )
        self.db.add(signature)
        
        # Update step with signature info
        step.signed_by = user_id
        step.signed_at = datetime.now(timezone.utc)
        
        # Now approve the step (reuse existing logic)
        step.status = WorkflowStepStatus.APPROVED
        step.completed_by = user_id
        step.completed_at = datetime.now(timezone.utc)
        
        instance = await self.db.get(WorkflowInstance, step.instance_id)
        
        # Create audit log
        audit = WorkflowAuditLog(
            step_id=step_id,
            instance_id=step.instance_id,
            user_id=user_id,
            action='signed_and_approved',
            old_status=WorkflowStepStatus.IN_PROGRESS.value,
            new_status=WorkflowStepStatus.APPROVED.value,
            comment=action.comment,
            audit_metadata={"signature_hash": signature_hash},
            timestamp=datetime.now(timezone.utc)
        )
        self.db.add(audit)
        
        # Determine next step
        next_step = await self._determine_next_step(step, instance, user_id)
        
        try:
            await self.db.commit()
            await self.db.refresh(step)
            if next_step:
                await self.db.refresh(next_step)
            
            # Notify next step assignees or completer
            try:
                await notify_step_approved(self.db, step, next_step, instance)
            except Exception as e:
                logger.warning(f"Failed to send approval notification: {e}")
            
            return step, next_step, signature_hash
        except SQLAlchemyError as e:
            await self.db.rollback()
            raise WorkflowServiceError(f"Failed to sign and approve step: {e}")

    async def get_step_signatures(self, step_id: int) -> List['WorkflowSignature']:
        """Get all signatures for a step."""
        from app.modules.workflow.models import WorkflowSignature
        result = await self.db.execute(
            select(WorkflowSignature)
            .where(WorkflowSignature.step_id == step_id)
            .order_by(WorkflowSignature.signed_at.asc())
        )
        return result.scalars().all()

    # ==================== Helper Methods ====================

    async def serialize_instance(self, instance: WorkflowInstance):
        """Собрать WorkflowInstanceResponse: шаги, исполнители, дедлайны, комментарии."""
        from app.modules.workflow.schemas import (
            WorkflowInstanceResponse,
            WorkflowStepInstanceResponse,
        )
        from sqlalchemy.orm import selectinload

        template = await self.db.get(WorkflowTemplate, instance.template_id)

        steps_result = await self.db.execute(
            select(WorkflowStep)
            .where(WorkflowStep.instance_id == instance.id)
            .order_by(WorkflowStep.order_index.asc())
            .options(selectinload(WorkflowStep.assignees))
        )
        steps = steps_result.scalars().all()

        step_ids = [s.id for s in steps]
        comment_counts: Dict[int, int] = {}
        if step_ids:
            counts_result = await self.db.execute(
                select(WorkflowComment.step_id, func.count(WorkflowComment.id))
                .where(WorkflowComment.step_id.in_(step_ids))
                .group_by(WorkflowComment.step_id)
            )
            comment_counts = {row[0]: row[1] for row in counts_result.all()}

        step_responses = []
        for s in steps:
            deadline = None
            if s.assigned_at and s.deadline_hours:
                deadline = s.assigned_at + timedelta(hours=s.deadline_hours)
            step_responses.append(
                WorkflowStepInstanceResponse(
                    id=s.id,
                    step_key=s.step_key,
                    step_name=s.step_name,
                    role=s.role,
                    assignment_type=s.assignment_type,
                    approval_type=s.approval_type,
                    deadline_hours=s.deadline_hours,
                    order_index=s.order_index,
                    status=s.status,
                    deadline=deadline,
                    assigned_users=[
                        {
                            "id": u.id,
                            "full_name": u.full_name or u.username or u.email or f"#{u.id}",
                        }
                        for u in s.assignees
                    ],
                    comments_count=comment_counts.get(s.id, 0),
                    is_delegated=s.is_delegated,
                    signed_by=s.signed_by,
                    signed_at=s.signed_at,
                    signature_hash=None,
                )
            )

        return WorkflowInstanceResponse(
            id=instance.id,
            template_id=instance.template_id,
            template_name=template.name if template else "",
            document_id=instance.document_id,
            document_revision=instance.document_revision,
            document_name=instance.document_name,
            project_id=instance.project_id,
            status=instance.status,
            current_step_id=instance.current_step_id,
            started_by=instance.started_by,
            started_at=instance.started_at,
            completed_at=instance.completed_at,
            launch_comment=instance.launch_comment,
            document_changed=instance.document_changed,
            created_at=instance.created_at,
            updated_at=instance.updated_at,
            steps=step_responses,
        )

    async def _determine_next_step(
        self,
        current_step: WorkflowStep,
        instance: WorkflowInstance,
        user_id: Optional[int] = None
    ) -> Optional[WorkflowStep]:
        """Determine the next step based on auto_transition rules."""
        auto_transition = current_step.auto_transition or {}
        
        if auto_transition.get('on_approve') == 'complete':
            # Complete the workflow
            instance.status = WorkflowStatus.COMPLETED
            instance.completed_at = datetime.now(timezone.utc)
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
            next_step.assigned_at = datetime.now(timezone.utc)
            instance.current_step_id = next_step.id
            
            # Create audit log for next step
            audit = WorkflowAuditLog(
                step_id=next_step.id,
                instance_id=instance.id,
                user_id=user_id if user_id is not None else (instance.started_by or 0),
                action='auto_assigned',
                old_status=None,
                new_status=WorkflowStepStatus.IN_PROGRESS.value,
                timestamp=datetime.now(timezone.utc)
            )
            self.db.add(audit)
        else:
            # No more steps - complete workflow
            instance.status = WorkflowStatus.COMPLETED
            instance.completed_at = datetime.now(timezone.utc)
        
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

    async def get_comments(self, step_id: int) -> List[WorkflowComment]:
        """Get comments for a workflow step."""
        result = await self.db.execute(
            select(WorkflowComment)
            .where(WorkflowComment.step_id == step_id)
            .order_by(WorkflowComment.created_at.asc())
        )
        return result.scalars().all()

    async def get_audit_log(self, instance_id: int) -> List[WorkflowAuditLog]:
        """Get audit log for workflow instance."""
        result = await self.db.execute(
            select(WorkflowAuditLog)
            .where(WorkflowAuditLog.instance_id == instance_id)
            .order_by(WorkflowAuditLog.timestamp.asc())
        )
        return result.scalars().all()

    # ==================== Routing Rule Methods ====================

    async def list_routing_rules(self, active_only: bool = False) -> List["WorkflowRoutingRule"]:
        """List routing rules ordered by specificity (priority desc)."""
        from app.modules.workflow.models import WorkflowRoutingRule
        from sqlalchemy.orm import selectinload

        query = select(WorkflowRoutingRule).options(
            selectinload(WorkflowRoutingRule.template),
            selectinload(WorkflowRoutingRule.project),
        )
        if active_only:
            query = query.where(WorkflowRoutingRule.is_active.is_(True))
        result = await self.db.execute(
            query.order_by(WorkflowRoutingRule.priority.desc(), WorkflowRoutingRule.id.asc())
        )
        return result.scalars().all()

    async def create_routing_rule(self, data) -> "WorkflowRoutingRule":
        """Create a routing rule."""
        from app.modules.workflow.models import WorkflowRoutingRule

        template = await self.get_template(data.template_id)
        if not template:
            raise WorkflowNotFoundError(f"Template {data.template_id} not found")

        rule = WorkflowRoutingRule(
            name=data.name,
            project_id=data.project_id,
            doc_type=data.doc_type,
            discipline=data.discipline,
            template_id=data.template_id,
            priority=data.priority,
            is_active=data.is_active,
        )
        self.db.add(rule)
        try:
            await self.db.commit()
            # Перечитываем с eager-подгрузкой связей — иначе сериализация
            # RoutingRuleResponse упадёт на ленивой загрузке вне greenlet
            return await self._get_routing_rule_eager(rule.id)
        except SQLAlchemyError as e:
            await self.db.rollback()
            raise WorkflowServiceError(f"Failed to create routing rule: {e}")

    async def update_routing_rule(self, rule_id: int, data) -> Optional["WorkflowRoutingRule"]:
        """Update a routing rule."""
        from app.modules.workflow.models import WorkflowRoutingRule

        rule = await self.db.get(WorkflowRoutingRule, rule_id)
        if not rule:
            return None

        updates = data.model_dump(exclude_unset=True)
        if "template_id" in updates and updates["template_id"] is not None:
            template = await self.get_template(updates["template_id"])
            if not template:
                raise WorkflowNotFoundError(
                    f"Template {updates['template_id']} not found"
                )
        for key, value in updates.items():
            setattr(rule, key, value)

        try:
            await self.db.commit()
            # Перечитываем с eager-подгрузкой связей — см. create_routing_rule
            return await self._get_routing_rule_eager(rule_id)
        except SQLAlchemyError as e:
            await self.db.rollback()
            raise WorkflowServiceError(f"Failed to update routing rule: {e}")

    async def _get_routing_rule_eager(self, rule_id: int) -> Optional["WorkflowRoutingRule"]:
        """Загрузить правило маршрутизации с подгруженными template/project."""
        from app.modules.workflow.models import WorkflowRoutingRule
        from sqlalchemy.orm import selectinload

        result = await self.db.execute(
            select(WorkflowRoutingRule)
            .where(WorkflowRoutingRule.id == rule_id)
            .options(
                selectinload(WorkflowRoutingRule.template),
                selectinload(WorkflowRoutingRule.project),
            )
        )
        return result.scalar_one_or_none()

    async def delete_routing_rule(self, rule_id: int) -> bool:
        """Delete a routing rule."""
        from app.modules.workflow.models import WorkflowRoutingRule

        rule = await self.db.get(WorkflowRoutingRule, rule_id)
        if not rule:
            return False
        try:
            await self.db.delete(rule)
            await self.db.commit()
            return True
        except SQLAlchemyError as e:
            await self.db.rollback()
            raise WorkflowServiceError(f"Failed to delete routing rule: {e}")

    async def match_routing_rule(
        self,
        project_id: Optional[int] = None,
        doc_type: Optional[str] = None,
        discipline: Optional[str] = None,
    ) -> Optional["WorkflowRoutingRule"]:
        """Подобрать сценарий для документа: самое специфичное совпадение.

        Правило подходит, если все его заполненные условия совпадают.
        Из подходящих выбирается правило с наибольшим числом условий,
        при равенстве — с большим priority.
        """
        rules = await self.list_routing_rules(active_only=True)
        best: Optional["WorkflowRoutingRule"] = None
        best_score = -1
        for rule in rules:
            if rule.project_id and rule.project_id != project_id:
                continue
            if rule.doc_type and rule.doc_type != doc_type:
                continue
            if rule.discipline and rule.discipline != discipline:
                continue
            score = (
                int(rule.project_id is not None)
                + int(rule.doc_type is not None)
                + int(rule.discipline is not None)
            )
            if (
                score > best_score
                or (best is not None and score == best_score and rule.priority > best.priority)
            ):
                best = rule
                best_score = score
        return best
