"""Workflow notifications — email + in-app triggers for workflow events."""
from typing import Optional, List
from datetime import datetime, timezone
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.email import send_notification_email
from app.modules.workflow.models import (
    WorkflowInstance, WorkflowStep, WorkflowStepStatus, WorkflowStatus
)
from app.modules.auth.models import User

logger = logging.getLogger(__name__)


async def _get_user_emails(db: AsyncSession, user_ids: List[int]) -> List[str]:
    """Fetch email addresses for given user IDs."""
    if not user_ids:
        return []
    result = await db.execute(
        select(User.email).where(User.id.in_(user_ids), User.email.is_not(None))
    )
    return [r[0] for r in result.all() if r[0]]


async def _get_step_assignee_ids(step: WorkflowStep) -> List[int]:
    """Extract assignee user IDs from a step."""
    return [u.id for u in step.assignees]


async def _get_instance_starter(db: AsyncSession, instance: WorkflowInstance) -> Optional[User]:
    """Get user who started the workflow instance."""
    if instance.started_by:
        return await db.get(User, instance.started_by)
    return None


async def _notify_assignees(
    db: AsyncSession,
    step: WorkflowStep,
    notification_type: str,
    data: dict,
) -> None:
    """Send email to all assignees of a step."""
    assignee_ids = await _get_step_assignee_ids(step)
    emails = await _get_user_emails(db, assignee_ids)
    for email in emails:
        try:
            await send_notification_email(email, notification_type, data)
        except Exception as e:
            logger.warning(f"Failed to send workflow email to {email}: {e}")


async def notify_workflow_started(
    db: AsyncSession,
    instance: WorkflowInstance,
    first_step: WorkflowStep,
) -> None:
    """Notify assignees of the first step when workflow starts."""
    data = {
        "workflow_id": instance.id,
        "document_name": instance.document_name or "—",
        "step_name": first_step.step_name,
        "deadline_hours": first_step.deadline_hours,
    }
    await _notify_assignees(db, first_step, "workflow_started", data)
    logger.info(f"Workflow {instance.id} started: notified {len(first_step.assignees)} assignees")


async def notify_step_approved(
    db: AsyncSession,
    step: WorkflowStep,
    next_step: Optional[WorkflowStep],
    instance: WorkflowInstance,
) -> None:
    """Notify next step assignees or workflow completer."""
    if next_step:
        data = {
            "workflow_id": instance.id,
            "document_name": instance.document_name or "—",
            "step_name": next_step.step_name,
            "previous_step": step.step_name,
            "deadline_hours": next_step.deadline_hours,
        }
        await _notify_assignees(db, next_step, "step_assigned", data)
    else:
        # Workflow completed — notify starter
        starter = await _get_instance_starter(db, instance)
        if starter and starter.email:
            data = {
                "workflow_id": instance.id,
                "document_name": instance.document_name or "—",
            }
            try:
                await send_notification_email(starter.email, "workflow_completed", data)
            except Exception as e:
                logger.warning(f"Failed to send completion email: {e}")


async def notify_step_rejected(
    db: AsyncSession,
    step: WorkflowStep,
    return_step: Optional[WorkflowStep],
    instance: WorkflowInstance,
    reason: str,
) -> None:
    """Notify author/starter and return step assignees on rejection."""
    starter = await _get_instance_starter(db, instance)
    if starter and starter.email:
        data = {
            "workflow_id": instance.id,
            "document_name": instance.document_name or "—",
            "step_name": step.step_name,
            "reason": reason,
        }
        try:
            await send_notification_email(starter.email, "step_rejected", data)
        except Exception as e:
            logger.warning(f"Failed to send rejection email to starter: {e}")

    if return_step:
        data = {
            "workflow_id": instance.id,
            "document_name": instance.document_name or "—",
            "step_name": return_step.step_name,
            "reason": reason,
        }
        await _notify_assignees(db, return_step, "step_rejected_return", data)


async def notify_step_delegated(
    db: AsyncSession,
    step: WorkflowStep,
    delegate_to_user: User,
    instance: WorkflowInstance,
    reason: Optional[str],
) -> None:
    """Notify the delegatee when a step is delegated."""
    if delegate_to_user.email:
        data = {
            "workflow_id": instance.id,
            "document_name": instance.document_name or "—",
            "step_name": step.step_name,
            "reason": reason or "—",
        }
        try:
            await send_notification_email(delegate_to_user.email, "step_delegated", data)
        except Exception as e:
            logger.warning(f"Failed to send delegation email: {e}")
