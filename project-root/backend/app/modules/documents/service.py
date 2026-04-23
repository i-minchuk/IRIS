"""Documents service - business logic layer."""

from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.modules.documents.repository import (
    DocumentRepository, RevisionRepository, 
    RemarkRepository, ApprovalWorkflowRepository
)
from app.modules.documents.variable_engine import render_document, cascade_update


class DocumentService:
    """Service for document business logic."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.doc_repo = DocumentRepository(db)
        self.revision_repo = RevisionRepository(db)
        self.remark_repo = RemarkRepository(db)
        self.workflow_repo = ApprovalWorkflowRepository(db)
    
    async def list_documents(
        self,
        project_id: Optional[int] = None,
        section_id: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """List documents with filters."""
        docs = await self.doc_repo.get_by_project(project_id, section_id)
        
        return [
            {
                "id": d.id,
                "number": d.number,
                "name": d.name,
                "doc_type": d.doc_type,
                "status": d.status,
                "crs_code": d.crs_code,
                "author_id": d.author_id,
                "project_id": d.project_id,
                "section_id": d.section_id,
                "created_at": d.created_at.isoformat() if d.created_at else None,
            }
            for d in docs
        ]
    
    async def get_document(self, document_id: int) -> Dict[str, Any]:
        """Get document by ID with full details."""
        doc = await self.doc_repo.get_by_id(document_id)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        locked_by_user = None
        if doc.locked_by:
            locked_by_user = {
                "id": doc.locked_by.id,
                "full_name": doc.locked_by.full_name or doc.locked_by.email
            }
        
        return {
            "id": doc.id,
            "number": doc.number,
            "name": doc.name,
            "doc_type": doc.doc_type,
            "status": doc.status,
            "crs_code": doc.crs_code,
            "crs_approved_date": doc.crs_approved_date.isoformat() if doc.crs_approved_date else None,
            "content": doc.content,
            "variables_snapshot": doc.variables_snapshot,
            "author_id": doc.author_id,
            "locked_by_user": locked_by_user,
            "created_at": doc.created_at.isoformat() if doc.created_at else None,
            "revisions": [
                {
                    "id": r.id,
                    "number": r.number,
                    "status": r.status,
                    "trigger_type": r.trigger_type,
                    "created_at": r.created_at.isoformat() if r.created_at else None,
                }
                for r in doc.revisions
            ],
            "remarks": [
                {
                    "id": rm.id,
                    "title": rm.title,
                    "severity": rm.severity,
                    "status": rm.status,
                    "remark_type": rm.remark_type,
                    "created_at": rm.created_at.isoformat() if rm.created_at else None,
                }
                for rm in doc.remarks
            ],
        }
    
    async def create_document(
        self, 
        data: Dict[str, Any],
        user_id: int
    ) -> Dict[str, Any]:
        """Create new document."""
        doc_data = {
            "project_id": data.get("project_id"),
            "stage_id": data.get("stage_id"),
            "kit_id": data.get("kit_id"),
            "section_id": data.get("section_id"),
            "number": data.get("number"),
            "name": data.get("name"),
            "doc_type": data.get("doc_type"),
            "status": data.get("status", "draft"),
            "author_id": user_id,
            "content": data.get("content", {}),
            "variables_snapshot": data.get("variables_snapshot", {}),
        }
        
        doc = await self.doc_repo.create(doc_data)
        
        return {
            "id": doc.id,
            "number": doc.number,
            "name": doc.name,
            "status": doc.status,
        }
    
    async def update_document(
        self,
        document_id: int,
        data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Update document."""
        doc = await self.doc_repo.get_by_id(document_id)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        doc = await self.doc_repo.update(doc, data)
        
        return {
            "id": doc.id,
            "number": doc.number,
            "name": doc.name,
            "status": doc.status,
            "content": doc.content,
        }
    
    async def lock_document(
        self,
        document_id: int,
        user_id: int
    ) -> Dict[str, Any]:
        """Lock document."""
        doc = await self.doc_repo.get_by_id(document_id)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        if doc.locked_by_id and doc.locked_by_id != user_id:
            # Get locker info for error message
            from sqlalchemy import select
            from app.modules.auth.models import User
            result = await self.db.execute(
                select(User).where(User.id == doc.locked_by_id)
            )
            locker = result.scalar_one_or_none()
            
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "message": "Document already locked",
                    "locked_by": locker.full_name or locker.email if locker else None,
                }
            )
        
        doc = await self.doc_repo.lock(doc, user_id)
        
        return {
            "document_id": doc.id,
            "locked_by_id": doc.locked_by_id,
            "locked_at": doc.locked_at.isoformat() if doc.locked_at else None
        }
    
    async def unlock_document(
        self,
        document_id: int,
        user_id: int
    ) -> Dict[str, Any]:
        """Unlock document."""
        doc = await self.doc_repo.get_by_id(document_id)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        if doc.locked_by_id and doc.locked_by_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Document locked by another user"
            )
        
        doc = await self.doc_repo.unlock(doc)
        
        return {
            "document_id": doc.id,
            "locked_by_id": None,
            "locked_at": None
        }
    
    async def create_revision(
        self,
        document_id: int,
        data: Dict[str, Any],
        user_id: int
    ) -> Dict[str, Any]:
        """Create new revision."""
        revision_data = {
            "document_id": document_id,
            "number": data.get("number"),
            "status": data.get("status", "draft"),
            "trigger_type": data.get("trigger_type"),
            "trigger_source_id": data.get("trigger_source_id"),
            "created_by_id": user_id,
            "changes_summary": data.get("changes_summary"),
            "diff_before": data.get("diff_before"),
            "diff_after": data.get("diff_after"),
            "affected_variables": data.get("affected_variables", []),
            "affected_documents": data.get("affected_documents", []),
        }
        
        revision = await self.revision_repo.create(revision_data)
        await self.revision_repo.update_document_revision(document_id, revision.id)
        
        return {
            "id": revision.id,
            "number": revision.number,
            "status": revision.status
        }
    
    async def create_remark(
        self,
        document_id: int,
        data: Dict[str, Any],
        user_id: int
    ) -> Dict[str, Any]:
        """Create new remark."""
        remark_data = {
            "document_id": document_id,
            "revision_id": data.get("revision_id"),
            "remark_type": data.get("remark_type", "internal"),
            "source_author_id": user_id,
            "source_organization": data.get("source_organization"),
            "source_department": data.get("source_department"),
            "target_page": data.get("target_page"),
            "target_coordinates": data.get("target_coordinates"),
            "target_element_id": data.get("target_element_id"),
            "target_text_selection": data.get("target_text_selection"),
            "title": data.get("title"),
            "description": data.get("description"),
            "severity": data.get("severity", "minor"),
            "category": data.get("category", "other"),
            "status": data.get("status", "new"),
            "deadline": data.get("deadline"),
        }
        
        remark = await self.remark_repo.create(remark_data)
        
        return {
            "id": remark.id,
            "title": remark.title,
            "severity": remark.severity,
            "status": remark.status,
        }
    
    async def update_remark_status(
        self,
        remark_id: int,
        data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Update remark status."""
        remark = await self.remark_repo.get_by_id(remark_id)
        if not remark:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Remark not found"
            )
        
        remark = await self.remark_repo.update_status(remark, data)
        
        return {"id": remark.id, "status": remark.status}
    
    async def start_approval_workflow(
        self,
        document_id: int,
        data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Start approval workflow."""
        workflow = await self.workflow_repo.create(
            {
                "document_id": document_id,
                "revision_id": data.get("revision_id"),
                "route_type": data.get("route_type"),
            },
            data.get("stages", [])
        )
        
        return {
            "id": workflow.id,
            "status": workflow.status,
            "stages_count": len(data.get("stages", []))
        }
    
    async def render_document(
        self,
        document_id: int,
        extra_variables: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Render document with variable substitution."""
        doc = await self.doc_repo.get_by_id(document_id)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        rendered = await render_document(self.db, doc, extra_variables)
        
        return {
            "document_id": doc.id,
            "rendered": rendered,
            "variables_snapshot": doc.variables_snapshot,
        }
    
    async def cascade_update(
        self,
        project_id: int,
        changed_keys: List[str]
    ) -> Dict[str, Any]:
        """Trigger cascade update for affected documents."""
        snapshots = await cascade_update(self.db, project_id, changed_keys)
        
        return {
            "affected_documents": len(snapshots),
            "document_ids": list(snapshots.keys()),
        }
    
    async def list_all_remarks(
        self,
        project_id: Optional[int] = None,
        severity: Optional[str] = None,
        status: Optional[str] = None,
        remark_type: Optional[str] = None,
        category: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """List all remarks with filters."""
        remarks = await self.doc_repo.get_all_remarks(
            project_id, severity, status, remark_type, category
        )
        
        return [
            {
                "id": r.id,
                "title": r.title,
                "description": r.description,
                "severity": r.severity,
                "status": r.status,
                "remark_type": r.remark_type,
                "category": r.category,
                "deadline": r.deadline.isoformat() if r.deadline else None,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "document_id": r.document_id,
                "document_number": r.document.number if r.document else None,
                "document_name": r.document.name if r.document else None,
                "project_id": r.document.project_id if r.document else None,
            }
            for r in remarks
        ]
