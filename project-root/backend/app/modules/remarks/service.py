"""Remark service - business logic for issue tracking."""
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime, date, timedelta
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.exc import SQLAlchemyError
import logging

from app.modules.remarks.models import (
    Remark, RemarkComment, RemarkTag,
    RemarkStatus, RemarkPriority, RemarkCategory, RemarkSource
)
from app.modules.remarks.schemas import (
    RemarkCreate, RemarkUpdate, RemarkFilter, RemarkAction, RemarkStatistics
)
from app.modules.auth.models import User

logger = logging.getLogger(__name__)


class RemarkServiceError(Exception):
    """Base exception for remark service."""
    pass


class RemarkNotFoundError(RemarkServiceError):
    """Remark not found."""
    pass


class RemarkCommentNotFoundError(RemarkServiceError):
    """Remark comment not found."""
    pass


class RemarkTagNotFoundError(RemarkServiceError):
    """Remark tag not found."""
    pass


class RemarkService:
    """Service for remark management."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # ==================== Remark CRUD ====================

    async def create_remark(
        self,
        remark_data: RemarkCreate,
        author_id: int
    ) -> Remark:
        """Create a new remark with history entry."""
        try:
            remark = Remark(
                project_id=remark_data.project_id,
                document_id=remark_data.document_id,
                revision_id=remark_data.revision_id,
                workflow_step_id=remark_data.workflow_step_id,
                source=remark_data.source,
                status=RemarkStatus.NEW,
                priority=remark_data.priority,
                category=remark_data.category,
                title=remark_data.title,
                description=remark_data.description,
                location_ref=remark_data.location_ref,
                author_id=author_id,
                assignee_id=remark_data.assignee_id,
                due_date=remark_data.due_date,
                history=[{
                    "action": "created",
                    "user_id": author_id,
                    "timestamp": datetime.utcnow().isoformat(),
                    "old_status": None,
                    "new_status": RemarkStatus.NEW.value,
                    "comment": "Замечание создано"
                }]
            )
            
            # Add tags
            if remark_data.tag_ids:
                for tag_id in remark_data.tag_ids:
                    tag = await self.db.get(RemarkTag, tag_id)
                    if tag:
                        remark.tags.append(tag)
            
            self.db.add(remark)
            await self.db.commit()
            await self.db.refresh(remark)
            await self.db.refresh(remark, ['tags'])
            
            logger.info(f"Remark created: {remark.id}")
            return remark
            
        except SQLAlchemyError as e:
            await self.db.rollback()
            logger.error(f"Error creating remark: {e}")
            raise RemarkServiceError(f"Failed to create remark: {e}")

    async def get_remark(self, remark_id: UUID) -> Optional[Remark]:
        """Get remark by ID with all relationships."""
        result = await self.db.execute(
            select(Remark)
            .where(Remark.id == remark_id)
        )
        remark = result.scalar_one_or_none()
        
        if remark:
            # Load related data
            await self.db.refresh(remark, ['tags'])
            await self.db.refresh(remark, ['comments'])
            
        return remark

    async def list_remarks(
        self,
        filters: RemarkFilter,
        current_user_id: Optional[int] = None
    ) -> Tuple[List[Remark], int]:
        """List remarks with filtering and pagination."""
        query = select(Remark)
        
        # Apply filters
        conditions = []
        
        if filters.project_id:
            conditions.append(Remark.project_id == filters.project_id)
        
        if filters.document_id:
            conditions.append(Remark.document_id == filters.document_id)
        
        if filters.status:
            conditions.append(Remark.status.in_(filters.status))
        
        if filters.priority:
            conditions.append(Remark.priority.in_(filters.priority))
        
        if filters.category:
            conditions.append(Remark.category.in_(filters.category))
        
        if filters.source:
            conditions.append(Remark.source.in_(filters.source))
        
        if filters.assignee_id:
            conditions.append(Remark.assignee_id == filters.assignee_id)
        
        if filters.author_id:
            conditions.append(Remark.author_id == filters.author_id)
        
        if filters.date_from:
            conditions.append(Remark.created_at >= filters.date_from)
        
        if filters.date_to:
            conditions.append(Remark.created_at <= filters.date_to)
        
        if filters.search_text:
            search_pattern = f"%{filters.search_text}%"
            conditions.append(or_(
                Remark.title.ilike(search_pattern),
                Remark.description.ilike(search_pattern),
                Remark.location_ref.ilike(search_pattern)
            ))
        
        if filters.tag_ids:
            # Subquery for tags
            from sqlalchemy.orm import aliased
            tag_alias = aliased(RemarkTag)
            query = query.join(
                remark_tag_links,
                Remark.id == remark_tag_links.c.remark_id
            ).join(
                tag_alias,
                tag_alias.id == remark_tag_links.c.tag_id
            ).where(tag_alias.id.in_(filters.tag_ids))
        
        if conditions:
            query = query.where(and_(*conditions))
        
        # Sorting
        sort_column = getattr(Remark, filters.sort_by, Remark.priority)
        if filters.sort_order == 'asc':
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())
        
        # Total count
        total_result = await self.db.execute(select(func.count()).select_from(query.subquery()))
        total = total_result.scalar() or 0
        
        # Pagination
        query = query.offset((filters.page - 1) * filters.page_size).limit(filters.page_size)
        result = await self.db.execute(query)
        remarks = result.scalars().all()
        
        return list(remarks), total

    async def update_remark(
        self,
        remark_id: UUID,
        update_data: RemarkUpdate,
        updated_by: int
    ) -> Optional[Remark]:
        """Update remark with history tracking."""
        remark = await self.get_remark(remark_id)
        if not remark:
            return None
        
        update_dict = update_data.model_dump(exclude_unset=True)
        history_entry = None
        
        # Track status change
        if 'status' in update_dict and update_dict['status'] != remark.status:
            history_entry = {
                "action": "status_change",
                "user_id": updated_by,
                "timestamp": datetime.utcnow().isoformat(),
                "old_status": remark.status.value,
                "new_status": update_dict['status'].value,
                "comment": update_dict.get('comment')
            }
        
        # Track assignee change
        if 'assignee_id' in update_dict and update_dict['assignee_id'] != remark.assignee_id:
            if not history_entry:
                history_entry = {
                    "action": "assignee_change",
                    "user_id": updated_by,
                    "timestamp": datetime.utcnow().isoformat(),
                    "old_value": str(remark.assignee_id),
                    "new_value": str(update_dict['assignee_id']),
                    "comment": update_dict.get('comment')
                }
        
        # Track priority change
        if 'priority' in update_dict and update_dict['priority'] != remark.priority:
            if not history_entry:
                history_entry = {
                    "action": "priority_change",
                    "user_id": updated_by,
                    "timestamp": datetime.utcnow().isoformat(),
                    "old_value": remark.priority.value,
                    "new_value": update_dict['priority'].value,
                    "comment": update_dict.get('comment')
                }
        
        # Apply updates
        for key, value in update_dict.items():
            if key != 'comment' and key != 'tag_ids':
                setattr(remark, key, value)
        
        # Handle resolution
        if update_dict.get('status') == RemarkStatus.RESOLVED:
            remark.resolution = update_dict.get('resolution')
            remark.resolved_by = updated_by
            remark.resolved_at = datetime.utcnow()
        
        # Add history entry
        if history_entry:
            remark.history.append(history_entry)
        
        # Update tags
        if 'tag_ids' in update_dict and update_dict['tag_ids'] is not None:
            remark.tags = []
            for tag_id in update_dict['tag_ids']:
                tag = await self.db.get(RemarkTag, tag_id)
                if tag:
                    remark.tags.append(tag)
        
        try:
            await self.db.commit()
            await self.db.refresh(remark)
            await self.db.refresh(remark, ['tags'])
            return remark
        except SQLAlchemyError as e:
            await self.db.rollback()
            logger.error(f"Error updating remark: {e}")
            raise RemarkServiceError(f"Failed to update remark: {e}")

    async def delete_remark(self, remark_id: UUID, deleted_by: int) -> bool:
        """Delete remark (hard delete)."""
        remark = await self.get_remark(remark_id)
        if not remark:
            return False
        
        try:
            await self.db.delete(remark)
            await self.db.commit()
            logger.info(f"Remark deleted: {remark_id}")
            return True
        except SQLAlchemyError as e:
            await self.db.rollback()
            logger.error(f"Error deleting remark: {e}")
            raise RemarkServiceError(f"Failed to delete remark: {e}")

    # ==================== Comment CRUD ====================

    async def add_comment(
        self,
        remark_id: UUID,
        comment_text: str,
        author_id: int,
        is_internal: bool = True
    ) -> RemarkComment:
        """Add comment to remark."""
        comment = RemarkComment(
            remark_id=remark_id,
            author_id=author_id,
            text=comment_text,
            is_internal=is_internal
        )
        
        self.db.add(comment)
        await self.db.commit()
        await self.db.refresh(comment)
        return comment

    async def delete_comment(
        self,
        remark_id: UUID,
        comment_id: int,
        deleted_by: int
    ) -> bool:
        """Delete comment (only author or admin)."""
        comment = await self.db.get(RemarkComment, comment_id)
        if not comment or comment.remark_id != remark_id:
            raise RemarkCommentNotFoundError("Comment not found")
        
        # Check permissions
        remark = await self.get_remark(remark_id)
        if not remark:
            return False
        
        # TODO: Add admin check
        if comment.author_id != deleted_by:
            raise RemarkServiceError("Only comment author can delete")
        
        try:
            await self.db.delete(comment)
            await self.db.commit()
            return True
        except SQLAlchemyError as e:
            await self.db.rollback()
            raise RemarkServiceError(f"Failed to delete comment: {e}")

    # ==================== Actions ====================

    async def perform_action(
        self,
        remark_id: UUID,
        action: RemarkAction,
        user_id: int
    ) -> Optional[Remark]:
        """Perform action on remark (assign, resolve, reject, etc.)."""
        remark = await self.get_remark(remark_id)
        if not remark:
            return None
        
        history_entry = {
            "action": action.action,
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat(),
            "comment": action.comment,
            "metadata": action.payload
        }
        
        if action.action == 'assign':
            remark.assignee_id = action.payload.get('assignee_id')
            history_entry['old_value'] = str(remark.assignee_id)
            history_entry['new_value'] = str(remark.assignee_id)
        
        elif action.action == 'resolve':
            remark.status = RemarkStatus.RESOLVED
            remark.resolution = action.payload.get('resolution')
            remark.resolved_by = user_id
            remark.resolved_at = datetime.utcnow()
            history_entry['old_status'] = remark.status.value
            history_entry['new_status'] = RemarkStatus.RESOLVED.value
        
        elif action.action == 'reject':
            remark.status = RemarkStatus.REJECTED
            history_entry['old_status'] = remark.status.value
            history_entry['new_status'] = RemarkStatus.REJECTED.value
        
        elif action.action == 'defer':
            remark.status = RemarkStatus.DEFERRED
            remark.due_date = action.payload.get('due_date')
            history_entry['old_status'] = remark.status.value
            history_entry['new_status'] = RemarkStatus.DEFERRED.value
        
        elif action.action == 'reopen':
            remark.status = RemarkStatus.IN_PROGRESS
            history_entry['old_status'] = remark.status.value
            history_entry['new_status'] = RemarkStatus.IN_PROGRESS.value
        
        elif action.action == 'close':
            remark.status = RemarkStatus.CLOSED
            history_entry['old_status'] = remark.status.value
            history_entry['new_status'] = RemarkStatus.CLOSED.value
        
        elif action.action == 'change_priority':
            remark.priority = RemarkPriority(action.payload.get('priority'))
            history_entry['old_value'] = remark.priority.value
            history_entry['new_value'] = action.payload.get('priority')
        
        remark.history.append(history_entry)
        
        try:
            await self.db.commit()
            await self.db.refresh(remark)
            return remark
        except SQLAlchemyError as e:
            await self.db.rollback()
            raise RemarkServiceError(f"Failed to perform action: {e}")

    async def link_remarks(self, remark_id: UUID, related_id: UUID) -> bool:
        """Link two remarks (bidirectional)."""
        remark = await self.get_remark(remark_id)
        related = await self.get_remark(related_id)
        
        if not remark or not related:
            return False
        
        if related.id not in remark.related_remark_ids:
            remark.related_remark_ids.append(related.id)
        if remark.id not in related.related_remark_ids:
            related.related_remark_ids.append(remark.id)
        
        try:
            await self.db.commit()
            return True
        except SQLAlchemyError as e:
            await self.db.rollback()
            raise RemarkServiceError(f"Failed to link remarks: {e}")

    # ==================== Statistics ====================

    async def get_statistics(
        self,
        project_id: Optional[int] = None,
        document_id: Optional[int] = None,
        assignee_id: Optional[int] = None
    ) -> RemarkStatistics:
        """Get remarks statistics."""
        # Base query
        query = select(Remark)
        if project_id:
            query = query.where(Remark.project_id == project_id)
        if document_id:
            query = query.where(Remark.document_id == document_id)
        
        result = await self.db.execute(query)
        remarks = result.scalars().all()
        
        # Calculate statistics
        by_status = {}
        by_priority = {}
        by_category = {}
        by_source = {}
        overdue_count = 0
        my_open_count = 0
        
        today = date.today()
        
        for remark in remarks:
            # By status
            by_status[remark.status.value] = by_status.get(remark.status.value, 0) + 1
            
            # By priority
            by_priority[remark.priority.value] = by_priority.get(remark.priority.value, 0) + 1
            
            # By category
            by_category[remark.category.value] = by_category.get(remark.category.value, 0) + 1
            
            # By source
            by_source[remark.source.value] = by_source.get(remark.source.value, 0) + 1
            
            # Overdue
            if remark.due_date and remark.due_date < today and remark.status not in [
                RemarkStatus.RESOLVED, RemarkStatus.CLOSED
            ]:
                overdue_count += 1
            
            # My open
            if assignee_id and remark.assignee_id == assignee_id and remark.status in [
                RemarkStatus.NEW, RemarkStatus.IN_PROGRESS
            ]:
                my_open_count += 1
        
        # Average resolution time
        resolved_remarks = [r for r in remarks if r.resolved_at]
        avg_resolution_time = None
        if resolved_remarks:
            total_hours = 0
            for r in resolved_remarks:
                if r.created_at and r.resolved_at:
                    delta = r.resolved_at - r.created_at
                    total_hours += delta.total_seconds() / 3600
            avg_resolution_time = round(total_hours / len(resolved_remarks), 2)
        
        return RemarkStatistics(
            total=len(remarks),
            by_status=by_status,
            by_priority=by_priority,
            by_category=by_category,
            by_source=by_source,
            overdue_count=overdue_count,
            my_open_count=my_open_count,
            avg_resolution_time_hours=avg_resolution_time
        )

    # ==================== Tag CRUD ====================

    async def create_tag(self, name: str, color: str, created_by: int) -> RemarkTag:
        """Create a new tag."""
        tag = RemarkTag(name=name, color=color)
        self.db.add(tag)
        await self.db.commit()
        await self.db.refresh(tag)
        return tag

    async def list_tags(self) -> List[RemarkTag]:
        """List all tags."""
        result = await self.db.execute(select(RemarkTag).order_by(RemarkTag.name))
        return result.scalars().all()

    async def delete_tag(self, tag_id: int) -> bool:
        """Delete tag."""
        tag = await self.db.get(RemarkTag, tag_id)
        if not tag:
            return False
        
        try:
            await self.db.delete(tag)
            await self.db.commit()
            return True
        except SQLAlchemyError as e:
            await self.db.rollback()
            raise RemarkServiceError(f"Failed to delete tag: {e}")
