"""Documents repository."""

from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.documents.models import (
    Document, Revision, ApprovalWorkflow, ApprovalStage, ActionTaskStatus,
    DocumentDelegation,
)
from app.modules.projects.models import Project


class DocumentRepository:
    """Repository for document operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_id(self, id: int) -> Optional[Document]:
        """Get document by ID with relations."""
        result = await self.db.execute(
            select(Document)
            .options(
                selectinload(Document.revisions),

                selectinload(Document.locked_by)
            )
            .where(Document.id == id)
        )
        return result.unique().scalar_one_or_none()
    
    async def get_by_project(
        self, 
        project_id: int,
        section_id: Optional[int] = None
    ) -> List[Document]:
        """Get documents by project and optional section."""
        query = select(Document).where(Document.project_id == project_id)
        if section_id:
            query = query.where(Document.section_id == section_id)
        query = query.order_by(Document.created_at.desc())
        
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def create(self, data: Dict[str, Any]) -> Document:
        """Create new document."""
        doc = Document(**data)
        self.db.add(doc)
        await self.db.commit()
        await self.db.refresh(doc)
        return doc
    
    async def update(self, doc: Document, data: Dict[str, Any]) -> Document:
        """Update document."""
        allowed = {
            "name", "number", "status", "crs_code", "content",
            "variables_snapshot", "section_id", "kit_id", "stage_id",
            "project_id", "discipline",
            "standard_ids", "assignee_ids",
        }
        for key, value in data.items():
            if key in allowed:
                setattr(doc, key, value)
        
        await self.db.commit()
        await self.db.refresh(doc)
        return doc
    
    async def delete(self, doc: Document) -> bool:
        """Delete document."""
        await self.db.delete(doc)
        await self.db.commit()
        return True

    async def soft_delete(
        self,
        doc: Document,
        user_id: int,
        reason: Optional[str] = None,
    ) -> Document:
        """Soft delete: exclude document from work (restorable)."""
        doc.is_deleted = True
        doc.deleted_at = datetime.now(timezone.utc)
        doc.deleted_by_id = user_id
        doc.delete_reason = reason
        await self.db.commit()
        await self.db.refresh(doc)
        return doc

    async def restore(self, doc: Document) -> Document:
        """Restore soft-deleted document back to work."""
        doc.is_deleted = False
        doc.deleted_at = None
        doc.deleted_by_id = None
        doc.delete_reason = None
        await self.db.commit()
        await self.db.refresh(doc)
        return doc
    
    async def lock(self, doc: Document, user_id: int) -> Document:
        """Lock document."""
        doc.locked_by_id = user_id
        doc.locked_at = datetime.now(timezone.utc)
        await self.db.commit()
        await self.db.refresh(doc)
        return doc
    
    async def unlock(self, doc: Document) -> Document:
        """Unlock document."""
        doc.locked_by_id = None
        doc.locked_at = None
        await self.db.commit()
        await self.db.refresh(doc)
        return doc
    
class RevisionRepository:
    """Repository for revision operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create(self, data: Dict[str, Any]) -> Revision:
        """Create new revision."""
        revision = Revision(**data)
        self.db.add(revision)
        await self.db.commit()
        await self.db.refresh(revision)
        return revision
    
    async def update_document_revision(
        self, 
        document_id: int, 
        revision_id: int
    ) -> None:
        """Update document current revision."""
        result = await self.db.execute(
            select(Document).where(Document.id == document_id)
        )
        doc = result.scalar_one_or_none()
        if doc:
            doc.current_revision_id = revision_id
            await self.db.commit()


class ApprovalWorkflowRepository:
    """Repository for approval workflow operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create(
        self, 
        data: Dict[str, Any],
        stages: List[Dict[str, Any]]
    ) -> ApprovalWorkflow:
        """Create new approval workflow with stages."""
        workflow = ApprovalWorkflow(
            document_id=data["document_id"],
            revision_id=data.get("revision_id"),
            route_type=data.get("route_type"),
            status="in_progress",
        )
        self.db.add(workflow)
        await self.db.flush()  # Get workflow ID
        
        # Create stages
        for idx, stage_data in enumerate(stages):
            stage = ApprovalStage(
                workflow_id=workflow.id,
                stage_id=stage_data.get("stage_id"),
                name=stage_data.get("name"),
                role=stage_data.get("role"),
                required=stage_data.get("required", True),
                assigned_to_id=stage_data.get("assigned_to_id"),
                sla_hours=stage_data.get("sla_hours"),
                sort_order=idx,
            )
            self.db.add(stage)
        
        await self.db.commit()
        await self.db.refresh(workflow)
        return workflow


class ActionTaskStatusRepository:
    """Repository for user-specific action task statuses."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_for_user(self, user_id: int) -> Dict[str, str]:
        """Return {task_key: status} for user."""
        result = await self.db.execute(
            select(ActionTaskStatus).where(ActionTaskStatus.user_id == user_id)
        )
        return {row.task_key: row.status for row in result.scalars().all()}

    async def upsert(self, user_id: int, task_key: str, status: str) -> None:
        """Create or update status for (user, task_key)."""
        result = await self.db.execute(
            select(ActionTaskStatus).where(
                ActionTaskStatus.user_id == user_id,
                ActionTaskStatus.task_key == task_key,
            )
        )
        row = result.scalar_one_or_none()
        if row:
            row.status = status
        else:
            self.db.add(
                ActionTaskStatus(user_id=user_id, task_key=task_key, status=status)
            )
        await self.db.commit()


class DelegationRepository:
    """Repository for temporary approval delegations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        user_id: int,
        delegate_id: int,
        expires_at: datetime,
        created_by_id: Optional[int] = None,
    ) -> DocumentDelegation:
        row = DocumentDelegation(
            user_id=user_id,
            delegate_id=delegate_id,
            expires_at=expires_at,
            created_by_id=created_by_id,
        )
        self.db.add(row)
        await self.db.commit()
        await self.db.refresh(row)
        return row

    async def get(self, delegation_id: int) -> Optional[DocumentDelegation]:
        result = await self.db.execute(
            select(DocumentDelegation).where(DocumentDelegation.id == delegation_id)
        )
        return result.scalar_one_or_none()

    async def list_active_for_users(
        self, user_ids: List[int], now: datetime
    ) -> List[DocumentDelegation]:
        """Активные делегирования, где user_id входит в переданный список."""
        if not user_ids:
            return []
        result = await self.db.execute(
            select(DocumentDelegation).where(
                DocumentDelegation.user_id.in_(user_ids),
                DocumentDelegation.expires_at > now,
            )
        )
        return result.scalars().all()

    async def list_for_user(self, user_id: int, now: datetime) -> List[DocumentDelegation]:
        """Активные делегирования пользователя: свои (user_id) и чужие (delegate_id)."""
        result = await self.db.execute(
            select(DocumentDelegation).where(
                DocumentDelegation.expires_at > now,
                (DocumentDelegation.user_id == user_id)
                | (DocumentDelegation.delegate_id == user_id),
            )
        )
        return result.scalars().all()

    async def delete(self, delegation: DocumentDelegation) -> None:
        await self.db.delete(delegation)
        await self.db.commit()

