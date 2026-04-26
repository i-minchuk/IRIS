"""Documents repository."""

from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.documents.models import (
    Document, Revision, Remark, ApprovalWorkflow, ApprovalStage
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
                selectinload(Document.remarks),
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
            "name", "status", "crs_code", "content", 
            "variables_snapshot", "section_id", "kit_id", "stage_id"
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
    
    async def get_all_remarks(
        self,
        project_id: Optional[int] = None,
        severity: Optional[str] = None,
        status: Optional[str] = None,
        remark_type: Optional[str] = None,
        category: Optional[str] = None,
    ) -> List[Remark]:
        """Get all remarks with filters - uses joinedload to avoid N+1."""
        from sqlalchemy.orm import joinedload
        
        query = select(Remark).options(joinedload(Remark.document))
        if project_id:
            query = query.join(Document).where(Document.project_id == project_id)
        if severity:
            query = query.where(Remark.severity == severity)
        if status:
            query = query.where(Remark.status == status)
        if remark_type:
            query = query.where(Remark.remark_type == remark_type)
        if category:
            query = query.where(Remark.category == category)
        
        result = await self.db.execute(query.order_by(Remark.created_at.desc()))
        return result.scalars().unique().all()


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


class RemarkRepository:
    """Repository for remark operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create(self, data: Dict[str, Any]) -> Remark:
        """Create new remark."""
        remark = Remark(**data)
        self.db.add(remark)
        await self.db.commit()
        await self.db.refresh(remark)
        return remark
    
    async def get_by_id(self, id: int) -> Optional[Remark]:
        """Get remark by ID."""
        result = await self.db.execute(
            select(Remark).where(Remark.id == id)
        )
        return result.scalar_one_or_none()
    
    async def update_status(
        self, 
        remark: Remark, 
        data: Dict[str, Any]
    ) -> Remark:
        """Update remark status."""
        if "status" in data:
            remark.status = data["status"]
        if "resolution_action" in data:
            remark.resolution_action = data["resolution_action"]
        if "response" in data:
            remark.response = data["response"]
        if "confirmed_by_customer" in data:
            remark.confirmed_by_customer = data["confirmed_by_customer"]
            remark.confirmed_at = datetime.utcnow()
        
        await self.db.commit()
        await self.db.refresh(remark)
        return remark


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
