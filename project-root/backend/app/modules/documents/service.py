"""Documents service - business logic layer."""

from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.modules.documents.repository import (
    DocumentRepository, RevisionRepository,
    ApprovalWorkflowRepository, ActionTaskStatusRepository
)
from app.modules.documents.variable_engine import render_document, cascade_update
from app.modules.gamification.service import GamificationService
from app.modules.gamification.repository import NotificationRepository
from app.parser.indexer import DocumentIndexer
from app.parser.factory import ParserFactory
from app.ai.classification import classify_document
import logging
import io

logger = logging.getLogger(__name__)


class DocumentService:
    """Service for document business logic."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.doc_repo = DocumentRepository(db)
        self.revision_repo = RevisionRepository(db)
        self.workflow_repo = ApprovalWorkflowRepository(db)
        self.action_task_repo = ActionTaskStatusRepository(db)
        self.notif_repo = NotificationRepository(db)
    
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
                "process_task_id": d.process_task_id,
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
            "discipline": doc.discipline,
            "crs_code": doc.crs_code,
            "crs_approved_date": doc.crs_approved_date.isoformat() if doc.crs_approved_date else None,
            "content": doc.content,
            "variables_snapshot": doc.variables_snapshot,
            "author_id": doc.author_id,
            "assignee_ids": doc.assignee_ids or [],
            "locked_by_user": locked_by_user,
            "ai_classified_type": doc.ai_classified_type,
            "ai_confidence": doc.ai_confidence,
            "standard_ids": doc.standard_ids or [],
            "process_task_id": doc.process_task_id,
            "has_file": any(r.file_path for r in doc.revisions),
            "created_at": doc.created_at.isoformat() if doc.created_at else None,
            "revisions": [
                {
                    "id": r.id,
                    "number": r.number,
                    "status": r.status,
                    "trigger_type": r.trigger_type,
                    "file_path": r.file_path,
                    "changes_summary": r.changes_summary,
                    "created_at": r.created_at.isoformat() if r.created_at else None,
                }
                for r in doc.revisions
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
            "discipline": data.get("discipline"),
            "author_id": user_id,
            "content": data.get("content", {}),
            "variables_snapshot": data.get("variables_snapshot", {}),
            "assignee_ids": data.get("assignee_ids") or [],
            "standard_ids": data.get("standard_ids") or [],
            "process_task_id": data.get("process_task_id"),
        }
        
        doc = await self.doc_repo.create(doc_data)
        
        # AI auto-classification if content available
        content = ""
        if doc.content and isinstance(doc.content, dict):
            content = doc.content.get("body") or doc.content.get("text") or ""
        if not content:
            content = doc.name or ""
        
        if content:
            try:
                result = await classify_document(content)
                doc.ai_classified_type = result.get("type")
                doc.ai_confidence = result.get("confidence")
                await self.db.commit()
            except Exception as exc:
                logger.warning("AI classification failed for doc %s: %s", doc.id, exc)
        
        return {
            "id": doc.id,
            "number": doc.number,
            "name": doc.name,
            "status": doc.status,
            "discipline": doc.discipline,
            "ai_classified_type": doc.ai_classified_type,
            "ai_confidence": doc.ai_confidence,
            "process_task_id": doc.process_task_id,
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
        
        # Remember whether the document was already approved to avoid duplicate awards.
        was_already_approved = doc.status == 'approved'
        # При смене проекта привязка к этапу/комплекту/разделу старого проекта
        # теряет смысл — сбрасываем, чтобы документ не висел в чужой структуре.
        if (
            "project_id" in data
            and data["project_id"] is not None
            and data["project_id"] != doc.project_id
        ):
            data = dict(data)
            data["stage_id"] = None
            data["kit_id"] = None
            data["section_id"] = None
        doc = await self.doc_repo.update(doc, data)
        
        # Gamification: award XP/points when document is approved.
        # Bonus points are given for speed (approved before planned deadline)
        # and quality (minimal revisions).
        if (
            data.get('status') == 'approved'
            and doc.author_id
            and not was_already_approved
        ):
            gamification = GamificationService(self.db)
            base_points = 20
            base_xp = 25
            bonus_points = 0
            bonus_xp = 0
            meta: Dict[str, Any] = {
                "base_points": base_points,
                "base_xp": base_xp,
            }
            now = datetime.now(timezone.utc)

            # Speed bonus: approved before planned end/ready date.
            planned = doc.planned_end or doc.planned_ready
            if planned and now <= planned:
                bonus_points += 10
                bonus_xp += 15
                meta["speed_bonus"] = {
                    "planned": planned.isoformat(),
                    "actual": now.isoformat(),
                }

            # Quality bonus: first-time approval (0 or 1 revisions).
            revision_count = len(doc.revisions) if doc.revisions else 0
            if revision_count <= 1:
                bonus_points += 10
                bonus_xp += 10
                meta["quality_bonus"] = {"revision_count": revision_count}

            await gamification.award_event(
                user_id=doc.author_id,
                event_type="document_approved",
                points=base_points + bonus_points,
                xp=base_xp + bonus_xp,
                ref_doc_id=doc.id,
                project_id=doc.project_id,
                comment=f"Document approved: +{bonus_points} quality/speed bonus",
                meta=meta,
            )
        
        return {
            "id": doc.id,
            "number": doc.number,
            "name": doc.name,
            "status": doc.status,
            "content": doc.content,
        }

    async def copy_document(
        self,
        document_id: int,
        user_id: int,
    ) -> Dict[str, Any]:
        """Создать копию документа (метаданные + содержимое, без файлов ревизий)."""
        doc = await self.doc_repo.get_by_id(document_id)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        if doc.is_deleted:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cannot copy an excluded document"
            )
        new_doc = await self.doc_repo.create({
            "project_id": doc.project_id,
            "stage_id": doc.stage_id,
            "kit_id": doc.kit_id,
            "section_id": doc.section_id,
            "number": doc.number,
            "name": f"{doc.name} (копия)",
            "doc_type": doc.doc_type,
            "status": "draft",
            "author_id": user_id,
            "content": doc.content,
            "variables_snapshot": doc.variables_snapshot,
            "assignee_ids": doc.assignee_ids or [],
            "standard_ids": doc.standard_ids or [],
            "process_task_id": None,
        })
        return {
            "id": new_doc.id,
            "number": new_doc.number,
            "name": new_doc.name,
            "status": new_doc.status,
        }

    async def soft_delete_document(
        self,
        document_id: int,
        user_id: int,
        reason: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Exclude document from work (soft delete, restorable)."""
        doc = await self.doc_repo.get_by_id(document_id)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        if doc.is_deleted:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Document is already excluded"
            )
        doc = await self.doc_repo.soft_delete(doc, user_id, reason)
        return {
            "id": doc.id,
            "number": doc.number,
            "name": doc.name,
            "status": doc.status,
            "is_deleted": doc.is_deleted,
            "deleted_at": doc.deleted_at.isoformat() if doc.deleted_at else None,
            "delete_reason": doc.delete_reason,
        }

    async def restore_document(
        self,
        document_id: int,
    ) -> Dict[str, Any]:
        """Restore previously excluded document back to work."""
        doc = await self.doc_repo.get_by_id(document_id)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        if not doc.is_deleted:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Document is not excluded"
            )
        doc = await self.doc_repo.restore(doc)
        return {
            "id": doc.id,
            "number": doc.number,
            "name": doc.name,
            "status": doc.status,
            "is_deleted": doc.is_deleted,
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
            "file_path": data.get("file_path"),
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
    
    async def bulk_import_documents(
        self,
        items: list[Dict[str, Any]],
        user_id: int
    ) -> List[Dict[str, Any]]:
        """Bulk import documents from external registry (Excel/MDR)."""
        created: List[Dict[str, Any]] = []
        for item in items:
            doc_data = {
                "project_id": item.get("project_id"),
                "stage_id": item.get("stage_id"),
                "kit_id": item.get("kit_id"),
                "section_id": item.get("section_id"),
                "number": item.get("number") or "",
                "name": item.get("name"),
                "doc_type": item.get("doc_type") or "specification",
                "status": item.get("status") or "draft",
                "crs_code": item.get("crs_code"),
                "author_id": user_id,
                "content": item.get("content", {}),
                "variables_snapshot": item.get("variables_snapshot", {}),
            }
            doc = await self.doc_repo.create(doc_data)
            created.append({
                "id": doc.id,
                "number": doc.number,
                "name": doc.name,
                "status": doc.status,
            })
        return created
    
    async def upload_document_file(
        self,
        document_id: int,
        file_stream: bytes,
        file_name: str,
        user_id: int
    ) -> Dict[str, Any]:
        """Upload a file for a document, create a revision and index content."""
        doc = await self.doc_repo.get_by_id(document_id)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        from app.core.config import settings
        import os
        import uuid
        
        ext = os.path.splitext(file_name)[1].lower()
        safe_name = f"{uuid.uuid4().hex}{ext}"
        doc_dir = os.path.join(settings.IRIS_STORAGE_ROOT, "documents", str(document_id))
        os.makedirs(doc_dir, exist_ok=True)
        file_path = os.path.join(doc_dir, safe_name)
        
        with open(file_path, "wb") as f:
            f.write(file_stream)
        
        revision = await self.create_revision(
            document_id,
            {
                "number": "A",
                "status": "draft",
                "changes_summary": f"File uploaded: {file_name}",
                "file_path": file_path,
            },
            user_id,
        )
        
        await self.index_document(document_id, file_stream=file_stream, file_name=file_name)
        
        return {
            "document_id": document_id,
            "revision_id": revision["id"],
            "file_path": file_path,
            "original_name": file_name,
        }

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
    
    async def submit_for_approval(
        self,
        document_id: int,
        user_id: int
    ) -> Dict[str, Any]:
        """Submit document for approval (CRS)."""
        doc = await self.doc_repo.get_by_id(document_id)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        if doc.status in ("crs_pending", "crs_approved", "approved"):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Document already in status '{doc.status}'"
            )
        
        # Create default approval workflow stages
        default_stages = [
            {"stage_id": "author_check", "name": "Проверка автора", "role": "author", "required": True},
            {"stage_id": "peer_review", "name": "Рецензирование", "role": "reviewer", "required": True},
            {"stage_id": "project_lead", "name": "Утверждение руководителем", "role": "project_lead", "required": True},
        ]
        
        workflow = await self.workflow_repo.create(
            {
                "document_id": document_id,
                "revision_id": doc.current_revision_id,
                "route_type": doc.doc_type or "KM",
            },
            default_stages
        )
        
        doc = await self.doc_repo.update(doc, {"status": "crs_pending"})
        
        return {
            "document_id": doc.id,
            "status": doc.status,
            "workflow_id": workflow.id,
        }
    
    async def submit_for_review(
        self,
        document_id: int,
        user_id: int
    ) -> Dict[str, Any]:
        """Submit document for review."""
        doc = await self.doc_repo.get_by_id(document_id)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        if doc.status not in ("draft", "in_review"):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Cannot submit for review from status '{doc.status}'"
            )
        
        doc = await self.doc_repo.update(doc, {"status": "in_review"})
        
        return {
            "document_id": doc.id,
            "status": doc.status,
        }

    async def approve_document(
        self,
        document_id: int,
        user_id: int,
    ) -> Dict[str, Any]:
        """Согласование документа текущим пользователем.

        Логика цепочки:
        - согласующие берутся из assignee_ids (Исполнитель(и));
        - если список пуст — документ согласует отправитель (одношаговое утверждение);
        - после каждого согласования документ передаётся следующему
          несогласовавшему из списка (статус in_review);
        - когда все согласовали — документ утверждается (статус approved).
        Прогресс хранится в content["approvals"] и возвращается в ответе.
        """
        from sqlalchemy import select
        from app.modules.auth.models import User

        doc = await self.doc_repo.get_by_id(document_id)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )

        if doc.status == "approved":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Документ уже утверждён",
            )

        content = dict(doc.content) if isinstance(doc.content, dict) else {}
        approvals = list(content.get("approvals") or [])
        if any(a.get("user_id") == user_id for a in approvals):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Вы уже согласовали этот документ",
            )

        approvers = list(doc.assignee_ids or [])
        if not approvers:
            approvers = [user_id]

        user = (
            await self.db.execute(select(User).where(User.id == user_id))
        ).scalar_one_or_none()
        user_name = (user.full_name if user else None) or f"Пользователь #{user_id}"

        approvals.append({
            "user_id": user_id,
            "user_name": user_name,
            "approved_at": datetime.now(timezone.utc).isoformat(),
        })
        content["approvals"] = approvals

        approved_ids = {a["user_id"] for a in approvals}
        pending_ids = [uid for uid in approvers if uid not in approved_ids]

        new_status = "approved" if not pending_ids else "in_review"
        doc = await self.doc_repo.update(doc, {"status": new_status, "content": content})

        pending = []
        if pending_ids:
            rows = (
                await self.db.execute(select(User).where(User.id.in_(pending_ids)))
            ).scalars().all()
            names = {u.id: u.full_name for u in rows}
            pending = [
                {"user_id": uid, "user_name": names.get(uid) or f"Пользователь #{uid}"}
                for uid in pending_ids
            ]

        try:
            if pending:
                next_name = pending[0]["user_name"]
                await self.notif_repo.create(
                    user_id=pending[0]["user_id"],
                    type="approval_pending",
                    title="Документ на согласовании",
                    message=(
                        f"Документ {doc.number} передан вам на согласование "
                        f"({user_name} согласовал). Далее в цепочке: {next_name}"
                        if len(pending) > 1
                        else f"Документ {doc.number} передан вам на согласование "
                             f"({user_name} согласовал)."
                    ),
                    meta={"link": f"/documents/{doc.id}"},
                )
            else:
                if doc.author_id and doc.author_id != user_id:
                    await self.notif_repo.create(
                        user_id=doc.author_id,
                        type="document_approved",
                        title="Документ утверждён",
                        message=f"Документ {doc.number} полностью согласован "
                                f"({user_name} завершил цепочку согласования).",
                        meta={"link": f"/documents/{doc.id}"},
                    )
        except Exception:
            logger.exception("Failed to create approval notification")

        return {
            "document_id": doc.id,
            "status": doc.status,
            "approved": not pending_ids,
            "approvals": approvals,
            "next_approver": pending[0] if pending else None,
            "pending_approvers": pending,
        }

    async def approval_feed(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Лента согласований по всем документам (для Документооборота)."""
        from sqlalchemy import select
        from app.modules.documents.models import Document

        result = await self.db.execute(
            select(Document)
            .where(Document.is_deleted.is_(False))
            .order_by(Document.updated_at.desc())
        )
        feed: List[Dict[str, Any]] = []
        for doc in result.scalars().all():
            content = doc.content if isinstance(doc.content, dict) else {}
            for a in content.get("approvals") or []:
                feed.append({
                    "document_id": doc.id,
                    "document_code": doc.number,
                    "document_name": doc.name,
                    "user_id": a.get("user_id"),
                    "user_name": a.get("user_name"),
                    "approved_at": a.get("approved_at"),
                    "document_status": doc.status,
                })
        feed.sort(key=lambda x: x["approved_at"] or "", reverse=True)
        return feed[:limit]

    async def get_action_task_statuses(self, user_id: int) -> Dict[str, str]:
        """Статусы производных задач документооборота для пользователя."""
        return await self.action_task_repo.get_for_user(user_id)

    async def set_action_task_status(
        self, user_id: int, task_key: str, new_status: str
    ) -> Dict[str, str]:
        """Сохранить статус производной задачи (new/in_progress/done)."""
        if new_status not in ("new", "in_progress", "done"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Статус должен быть одним из: new, in_progress, done",
            )
        await self.action_task_repo.upsert(user_id, task_key, new_status)
        return {"task_key": task_key, "status": new_status}

    
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
    

    async def index_document(
        self,
        document_id: int,
        file_stream: Optional[bytes] = None,
        file_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Index document content into Qdrant for semantic search."""
        doc = await self.doc_repo.get_by_id(document_id)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        # Try to get content from file upload first
        parsed = None
        if file_stream and file_name:
            try:
                from app.parser.factory import ParserFactory
                stream = io.BytesIO(file_stream)
                parsed = ParserFactory.parse(stream, file_name)
            except Exception as exc:
                logger.warning("Parser failed for doc %s: %s", document_id, exc)
        
        # Fallback: use document.content JSON
        if not parsed and doc.content and isinstance(doc.content, dict):
            text = doc.content.get("body") or doc.content.get("text") or ""
            if text:
                from uuid import uuid4
                parsed = ParsedDocument(
                    document_id=uuid4(),
                    file_name=doc.name or f"doc_{document_id}",
                    file_type="text",
                    content=text,
                    sections=[],
                    metadata={"document_id": document_id, "source": "content"},
                    entities=[],
                )
        
        if not parsed:
            return {"document_id": document_id, "indexed": False, "chunks": 0, "reason": "no content"}
        
        # Override document_id to match our DB id
        from uuid import uuid4
        parsed.document_id = uuid4()
        
        try:
            indexer = DocumentIndexer()
            chunk_ids = await indexer.index(parsed, original_doc_id=parsed.document_id)
            
            # Store index metadata in document.content
            if doc.content is None or not isinstance(doc.content, dict):
                doc.content = {}
            doc.content["qdrant_indexed"] = {
                "chunks": len(chunk_ids),
                "indexed_at": str(datetime.now(timezone.utc)),
                "collection": indexer.collection,
            }
            await self.db.commit()
            
            return {
                "document_id": document_id,
                "indexed": True,
                "chunks": len(chunk_ids),
            }
        except Exception as exc:
            logger.warning("Qdrant indexing failed for doc %s: %s", document_id, exc)
            return {"document_id": document_id, "indexed": False, "chunks": 0, "reason": str(exc)}
