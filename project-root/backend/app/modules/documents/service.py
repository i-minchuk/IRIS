"""Documents service - business logic layer."""

from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.modules.documents.repository import (
    DocumentRepository, RevisionRepository,
    ApprovalWorkflowRepository, ActionTaskStatusRepository,
    DelegationRepository,
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

# Рабочие часы для дедлайнов: пн–пт, 09:00–19:00 (Europe/Moscow).
_BUSINESS_TZ_NAME = "Europe/Moscow"
_BUSINESS_DAY_START_HOUR = 9
_BUSINESS_DAY_END_HOUR = 19


def _to_business_tz(dt: datetime) -> "datetime":
    from zoneinfo import ZoneInfo

    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(ZoneInfo(_BUSINESS_TZ_NAME))


def business_hours_between(start: datetime, end: datetime) -> float:
    """Рабочие часы (пн–пт 09:00–19:00 МСК) между start и end.

    Положительно, если end позже start. Округление вверх до 0.1 ч.
    """
    if end <= start:
        return 0.0
    current = _to_business_tz(start)
    finish = _to_business_tz(end)
    total = 0.0
    day = current.date()
    from datetime import time as dtime, timedelta as dt_delta

    while True:
        day_start = datetime.combine(
            day, dtime(_BUSINESS_DAY_START_HOUR), tzinfo=current.tzinfo
        )
        day_end = datetime.combine(
            day, dtime(_BUSINESS_DAY_END_HOUR), tzinfo=current.tzinfo
        )
        if day_start.weekday() < 5:  # 0=пн … 4=пт
            window_start = max(current, day_start)
            window_end = min(finish, day_end)
            if window_end > window_start:
                total += (window_end - window_start).total_seconds() / 3600
        if day_end >= finish:
            break
        day = day + dt_delta(days=1)
    return round(total, 1)


class DocumentService:
    """Service for document business logic."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.doc_repo = DocumentRepository(db)
        self.revision_repo = RevisionRepository(db)
        self.workflow_repo = ApprovalWorkflowRepository(db)
        self.action_task_repo = ActionTaskStatusRepository(db)
        self.notif_repo = NotificationRepository(db)
        self.delegation_repo = DelegationRepository(db)
    
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

        # Уведомляем исполнителей о назначении документа в работу
        await self._notify_assignees(doc, doc.assignee_ids or [], user_id)
        
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
        actor_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Update document."""
        doc = await self.doc_repo.get_by_id(document_id)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        # Снимок исполнителей до обновления — для уведомления только новых.
        old_assignee_ids = set(doc.assignee_ids or [])
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

        # Уведомляем только добавленных исполнителей (diff старого и нового списков).
        if "assignee_ids" in data:
            new_assignee_ids = set(doc.assignee_ids or []) - old_assignee_ids
            removed_assignee_ids = old_assignee_ids - set(doc.assignee_ids or [])
            if removed_assignee_ids or new_assignee_ids:
                # История замен согласующих — кто, когда и кого изменил.
                try:
                    from sqlalchemy import select as _select
                    from app.modules.auth.models import User as _User

                    current_content = (
                        dict(doc.content) if isinstance(doc.content, dict) else {}
                    )
                    history = list(current_content.get("assignee_history") or [])
                    changed_ids = sorted(new_assignee_ids | removed_assignee_ids)
                    id_filter = list(set(changed_ids) | ({actor_id} if actor_id else set()))
                    rows = (
                        await self.db.execute(
                            _select(_User).where(_User.id.in_(id_filter))
                        )
                    ).scalars().all()
                    names = {u.id: (u.full_name or u.email or f"№{u.id}") for u in rows}
                    history.append({
                        "at": datetime.now(timezone.utc).isoformat(),
                        "actor_id": actor_id,
                        "actor_name": names.get(actor_id) if actor_id else None,
                        "added": [names.get(uid, f"№{uid}") for uid in sorted(new_assignee_ids)],
                        "removed": [
                            names.get(uid, f"№{uid}") for uid in sorted(removed_assignee_ids)
                        ],
                    })
                    current_content["assignee_history"] = history[-20:]
                    await self.doc_repo.update(doc, {"content": current_content})
                except Exception as exc:
                    logger.warning("Failed to record assignee history for doc %s: %s", doc.id, exc)
            if new_assignee_ids:
                await self._notify_assignees(doc, list(new_assignee_ids), actor_id)
        
        return {
            "id": doc.id,
            "number": doc.number,
            "name": doc.name,
            "status": doc.status,
            "content": doc.content,
        }

    async def _notify_assignees(
        self,
        doc,
        assignee_ids: List[int],
        actor_id: Optional[int] = None,
    ) -> None:
        """Уведомление исполнителей о назначении документа в работу (in-app + email + telegram)."""
        from app.modules.auth.models import User

        for assignee_id in assignee_ids or []:
            if assignee_id == actor_id:
                continue
            assignee = await self.db.get(User, assignee_id)
            if assignee is None:
                continue
            title_doc = doc.number or doc.name or f"№{doc.id}"
            deadline = doc.planned_end or doc.planned_ready
            due = f" Срок: {deadline.strftime('%d.%m.%Y')}." if deadline else ""
            try:
                await self.notif_repo.create_and_notify(
                    user_id=assignee.id,
                    type="document_assigned",
                    title=f"Вам назначен документ: {title_doc}",
                    message=f"Документ «{title_doc}» назначен вам в работу.{due}",
                    user_email=assignee.email,
                    email_notifications_enabled=assignee.email_notifications_enabled,
                    telegram_chat_id=assignee.telegram_chat_id,
                    meta={"link": f"/documents/{doc.id}", "document_id": doc.id},
                )
            except Exception as exc:
                # Уведомление не должно ломать основную операцию с документом.
                logger.warning("Failed to notify assignee %s for doc %s: %s", assignee_id, doc.id, exc)

    def _pending_approver_ids(self, doc, approvals: List[Dict[str, Any]]) -> List[int]:
        """Согласующие из assignee_ids, которые ещё не согласовали."""
        approvers = list(doc.assignee_ids or [])
        approved_ids = {a.get("user_id") for a in approvals or []}
        return [uid for uid in approvers if uid not in approved_ids]

    async def _notify_pending_approvers(
        self,
        doc,
        pending_ids: List[int],
        actor_id: Optional[int],
        intro: str,
        notif_type: str = "approval_pending",
    ) -> None:
        """Уведомление согласующих, что документ ожидает их шага (in-app + email + telegram)."""
        from app.modules.auth.models import User

        deadline = doc.planned_end or doc.planned_ready
        due = f" Срок: {deadline.strftime('%d.%m.%Y')}." if deadline else ""
        title_doc = doc.number or doc.name or f"№{doc.id}"
        for uid in pending_ids or []:
            if uid == actor_id:
                continue
            user = await self.db.get(User, uid)
            if user is None:
                continue
            try:
                await self.notif_repo.create_and_notify(
                    user_id=user.id,
                    type=notif_type,
                    title=f"Документ на согласовании: {title_doc}",
                    message=f"{intro} Документ «{title_doc}» ожидает вашего согласования.{due}",
                    user_email=user.email,
                    email_notifications_enabled=user.email_notifications_enabled,
                    telegram_chat_id=user.telegram_chat_id,
                    meta={"link": f"/documents/{doc.id}", "document_id": doc.id},
                )
            except Exception as exc:
                # Уведомление не должно ломать согласование.
                logger.warning("Failed to notify approver %s for doc %s: %s", uid, doc.id, exc)

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
        
        # Уведомляем согласующих о старте цепочки согласования
        content = doc.content if isinstance(doc.content, dict) else {}
        pending_ids = self._pending_approver_ids(doc, list(content.get("approvals") or []))
        if pending_ids:
            await self._notify_pending_approvers(
                doc, pending_ids, user_id, "Запущено согласование."
            )
        
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

        approvers = list(doc.assignee_ids or [])
        if not approvers:
            approvers = [user_id]

        # Делегирование: активный делегат может согласовать от имени согласующего.
        now = datetime.now(timezone.utc)
        on_behalf_of: Optional[int] = None
        if user_id not in approvers:
            delegations = await self.delegation_repo.list_active_for_users(
                approvers, now
            )
            match = next(
                (d for d in delegations if d.delegate_id == user_id), None
            )
            if match is None:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Вы не являетесь согласующим по этому документу",
                )
            on_behalf_of = match.user_id

        effective_id = on_behalf_of if on_behalf_of is not None else user_id
        if any(a.get("user_id") == effective_id for a in approvals):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "Делегирующий уже согласовал этот документ"
                    if on_behalf_of is not None
                    else "Вы уже согласовали этот документ"
                ),
            )

        user = (
            await self.db.execute(select(User).where(User.id == user_id))
        ).scalar_one_or_none()
        user_name = (user.full_name if user else None) or f"Пользователь #{user_id}"

        approver_user = None
        if on_behalf_of is not None:
            approver_user = await self.db.get(User, on_behalf_of)
        approver_name = (
            (approver_user.full_name if approver_user else None)
            or f"Пользователь #{effective_id}"
        )

        approval_entry: Dict[str, Any] = {
            "user_id": effective_id,
            "user_name": approver_name,
            "approved_at": now.isoformat(),
        }
        if on_behalf_of is not None:
            approval_entry["approved_by"] = user_id
            approval_entry["approved_by_name"] = user_name
        approvals.append(approval_entry)
        content["approvals"] = approvals

        approved_ids = {a["user_id"] for a in approvals}
        pending_ids = [uid for uid in approvers if uid not in approved_ids]

        new_status = "approved" if not pending_ids else "in_review"
        doc = await self.doc_repo.update(doc, {"status": new_status, "content": content})

        # Метрики срывов сроков по цепочке документов: событие согласующему
        # (в срок / с опозданием) + длительность согласования в meta.hours.
        try:
            planned = doc.planned_end or doc.planned_ready
            chain_start = doc.created_at
            if chain_start is not None and chain_start.tzinfo is None:
                chain_start = chain_start.replace(tzinfo=timezone.utc)
            hours = (
                round((now - chain_start).total_seconds() / 3600, 1)
                if chain_start is not None
                else None
            )
            on_time = bool(planned and now <= planned)
            gamification = GamificationService(self.db)
            await gamification.award_event(
                user_id=effective_id,
                event_type=(
                    "document_approval_on_time" if on_time
                    else "document_approval_late"
                ),
                points=0,
                xp=5 if on_time else 0,
                ref_doc_id=doc.id,
                project_id=doc.project_id,
                comment=(
                    f"Document approval {'on time' if on_time else 'late'}"
                    f" (doc {doc.number})"
                ),
                meta={
                    "hours": hours,
                    "on_behalf_of": on_behalf_of,
                    "planned": planned.isoformat() if planned else None,
                },
            )
        except Exception as exc:
            logger.warning("Failed to award approval metric for doc %s: %s", doc.id, exc)

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
            if pending_ids:
                intro = (
                    f"{user_name} согласовал(а) от имени {approver_name}, "
                    "документ передан дальше по цепочке."
                    if on_behalf_of is not None
                    else f"{user_name} согласовал(а), документ передан дальше по цепочке."
                )
                await self._notify_pending_approvers(
                    doc,
                    pending_ids,
                    user_id,
                    intro,
                )
            else:
                if doc.author_id and doc.author_id != user_id:
                    author = await self.db.get(User, doc.author_id)
                    if author is not None:
                        await self.notif_repo.create_and_notify(
                            user_id=author.id,
                            type="document_approved",
                            title="Документ утверждён",
                            message=f"Документ {doc.number} полностью согласован "
                                    f"({user_name} завершил цепочку согласования).",
                            user_email=author.email,
                            email_notifications_enabled=author.email_notifications_enabled,
                            telegram_chat_id=author.telegram_chat_id,
                            meta={"link": f"/documents/{doc.id}", "document_id": doc.id},
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
            deadline = doc.planned_end or doc.planned_ready
            approved_ids = {a.get("user_id") for a in content.get("approvals") or []}
            pending = [
                uid for uid in (doc.assignee_ids or []) if uid not in approved_ids
            ]
            for a in content.get("approvals") or []:
                feed.append({
                    "document_id": doc.id,
                    "document_code": doc.number,
                    "document_name": doc.name,
                    "user_id": a.get("user_id"),
                    "user_name": a.get("user_name"),
                    "approved_at": a.get("approved_at"),
                    "document_status": doc.status,
                    "deadline": deadline.isoformat() if deadline else None,
                    "pending_count": len(pending),
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

    async def _delegation_targets(self, pending_ids: List[int]) -> List[int]:
        """Согласующие плюс их активные делегаты (для уведомлений)."""
        now = datetime.now(timezone.utc)
        delegations = await self.delegation_repo.list_active_for_users(
            list(pending_ids), now
        )
        extra = [d.delegate_id for d in delegations if d.delegate_id not in pending_ids]
        return list(pending_ids) + extra

    async def check_document_deadlines(
        self, threshold_hours: int = 24
    ) -> Dict[str, int]:
        """Напоминания и эскалации по дедлайнам согласования документов.

        Документы в статусе in_review с planned_end/planned_ready:
        - за threshold_hours календарных часов (или менее 8 рабочих часов)
          до срока — согласующим, их делегатам и автору (deadline_approaching),
          один раз — флаг content["deadline_reminded_at"];
        - при просрочке более чем на 2 рабочих часа (пн–пт 09:00–19:00 МСК) —
          руководителю проекта (approval_escalation), один раз — флаг
          content["deadline_escalated_at"];
        - если сутки после эскалации документ всё ещё не согласован —
          администраторам (approval_escalation, «2-го уровня»), один раз —
          флаг content["deadline_escalated_at_level2"].
        Миграция не нужна (content — JSONB).
        """
        from sqlalchemy import or_, select
        from app.modules.auth.models import User
        from app.modules.documents.models import Document
        from app.modules.projects.models import Project

        now = datetime.now(timezone.utc)
        result = await self.db.execute(
            select(Document).where(
                Document.status == "in_review",
                Document.is_deleted.is_(False),
                or_(
                    Document.planned_end.isnot(None),
                    Document.planned_ready.isnot(None),
                ),
            )
        )
        checked = 0
        reminded = 0
        escalated = 0
        escalated_level2 = 0
        for doc in result.scalars().all():
            checked += 1
            try:
                content = dict(doc.content) if isinstance(doc.content, dict) else {}
                reminded_at = content.get("deadline_reminded_at")
                escalated_at = content.get("deadline_escalated_at")
                escalated2_at = content.get("deadline_escalated_at_level2")
                if reminded_at and escalated_at and escalated2_at:
                    continue  # по этому документу всё уже отправлено
                deadline = doc.planned_end or doc.planned_ready
                if deadline is None:
                    continue
                if deadline.tzinfo is None:
                    deadline = deadline.replace(tzinfo=timezone.utc)
                remaining = deadline - now
                business_remaining = (
                    business_hours_between(now, deadline) if remaining > timedelta(0)
                    else 0.0
                )
                business_overdue = (
                    business_hours_between(deadline, now) if remaining < timedelta(0)
                    else 0.0
                )
                need_reminder = not reminded_at and (
                    remaining <= timedelta(hours=threshold_hours)
                    or 0 < business_remaining <= 8
                )
                need_escalation = not escalated_at and business_overdue >= 2
                need_level2 = False
                if escalated_at and not escalated2_at:
                    try:
                        first_sent = datetime.fromisoformat(escalated_at)
                        if first_sent.tzinfo is None:
                            first_sent = first_sent.replace(tzinfo=timezone.utc)
                        need_level2 = (now - first_sent) >= timedelta(hours=24)
                    except (TypeError, ValueError):
                        need_level2 = False
                if not (need_reminder or need_escalation or need_level2):
                    continue
                approvals = list(content.get("approvals") or [])
                pending_ids = self._pending_approver_ids(doc, approvals)
                if not pending_ids:
                    continue  # все согласовали — документ скоро утвердится
                title_doc = doc.number or doc.name or f"№{doc.id}"
                names = []
                for uid in pending_ids:
                    u = await self.db.get(User, uid)
                    if u is not None:
                        names.append(u.full_name or u.email or f"№{uid}")
                who = ", ".join(names) if names else "—"
                notify_ids = await self._delegation_targets(pending_ids)
                changed = False
                if need_reminder:
                    is_overdue = remaining.total_seconds() < 0
                    if is_overdue:
                        intro = "Дедлайн по документу истёк."
                    elif remaining <= timedelta(hours=threshold_hours):
                        intro = (
                            f"До дедлайна осталось менее {threshold_hours} часов."
                        )
                    else:
                        intro = (
                            "До дедлайна осталось менее одного рабочего дня "
                            f"(рабочих часов: {business_remaining})."
                        )
                    await self._notify_pending_approvers(
                        doc, notify_ids, actor_id=None, intro=intro,
                        notif_type="deadline_approaching",
                    )
                    # Автор получает сводку, если не входит в число согласующих.
                    author_id = getattr(doc, "author_id", None)
                    if author_id and author_id not in pending_ids:
                        author = await self.db.get(User, author_id)
                        if author is not None:
                            try:
                                await self.notif_repo.create_and_notify(
                                    user_id=author.id,
                                    type="deadline_approaching",
                                    title=f"Дедлайн согласования: {title_doc}",
                                    message=(
                                        f"{intro} Документ «{title_doc}» ещё не "
                                        f"согласован. Ожидают: {who}."
                                    ),
                                    user_email=author.email,
                                    email_notifications_enabled=author.email_notifications_enabled,
                                    telegram_chat_id=author.telegram_chat_id,
                                    meta={
                                        "link": f"/documents/{doc.id}",
                                        "document_id": doc.id,
                                    },
                                )
                            except Exception as exc:
                                logger.warning(
                                    "Failed to notify author %s for doc %s: %s",
                                    author_id, doc.id, exc,
                                )
                    content["deadline_reminded_at"] = now.isoformat()
                    reminded += 1
                    changed = True
                if need_escalation:
                    project = (
                        await self.db.get(Project, doc.project_id)
                        if doc.project_id
                        else None
                    )
                    manager_id = project.manager_id if project else None
                    if manager_id:
                        manager = await self.db.get(User, manager_id)
                        if manager is not None:
                            try:
                                await self.notif_repo.create_and_notify(
                                    user_id=manager.id,
                                    type="approval_escalation",
                                    title=f"Эскалация: {title_doc} просрочен",
                                    message=(
                                        f"Документ «{title_doc}» не согласован "
                                        f"в срок (дедлайн "
                                        f"{deadline.strftime('%d.%m.%Y')}, "
                                        f"просрочка более {business_overdue} "
                                        f"раб. ч). Ожидают: {who}. "
                                        "Требуется вмешательство руководителя."
                                    ),
                                    user_email=manager.email,
                                    email_notifications_enabled=manager.email_notifications_enabled,
                                    telegram_chat_id=manager.telegram_chat_id,
                                    meta={
                                        "link": f"/documents/{doc.id}",
                                        "document_id": doc.id,
                                    },
                                )
                            except Exception as exc:
                                logger.warning(
                                    "Failed to notify manager %s for doc %s: %s",
                                    manager_id, doc.id, exc,
                                )
                            content["deadline_escalated_at"] = now.isoformat()
                            escalated += 1
                            changed = True
                if need_level2:
                    admins = (
                        await self.db.execute(
                            select(User).where(
                                or_(
                                    User.is_superuser.is_(True),
                                    User.role == "admin",
                                )
                            )
                        )
                    ).scalars().all()
                    for admin in admins:
                        try:
                            await self.notif_repo.create_and_notify(
                                user_id=admin.id,
                                type="approval_escalation",
                                title=f"Эскалация 2-го уровня: {title_doc}",
                                message=(
                                    f"Документ «{title_doc}» не согласован более "
                                    "суток после эскалации руководителю проекта. "
                                    f"Дедлайн: {deadline.strftime('%d.%m.%Y')}. "
                                    f"Ожидают: {who}."
                                ),
                                user_email=admin.email,
                                email_notifications_enabled=admin.email_notifications_enabled,
                                telegram_chat_id=admin.telegram_chat_id,
                                meta={
                                    "link": f"/documents/{doc.id}",
                                    "document_id": doc.id,
                                },
                            )
                        except Exception as exc:
                            logger.warning(
                                "Failed to notify admin %s for doc %s: %s",
                                admin.id, doc.id, exc,
                            )
                    content["deadline_escalated_at_level2"] = now.isoformat()
                    escalated_level2 += 1
                    changed = True
                if changed:
                    await self.doc_repo.update(doc, {"content": content})
            except Exception as exc:  # один документ не должен ломать прогон
                logger.warning("Deadline check failed for doc %s: %s", doc.id, exc)
        return {
            "checked": checked,
            "reminded": reminded,
            "escalated": escalated,
            "escalated_level2": escalated_level2,
        }

    async def remind_approvers(
        self, document_id: int, actor_id: int
    ) -> Dict[str, Any]:
        """Ручное напоминание несогласовавшим согласующим (и их делегатам)."""
        from app.modules.auth.models import User

        doc = await self.doc_repo.get_by_id(document_id)
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Document not found"
            )
        if doc.status != "in_review":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Документ не находится на согласовании",
            )
        content = dict(doc.content) if isinstance(doc.content, dict) else {}
        approvals = list(content.get("approvals") or [])
        pending_ids = self._pending_approver_ids(doc, approvals)
        if not pending_ids:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Некому напоминать — все согласующие уже согласовали",
            )
        actor = await self.db.get(User, actor_id)
        actor_name = (
            (actor.full_name if actor else None) or f"Пользователь #{actor_id}"
        )
        notify_ids = await self._delegation_targets(pending_ids)
        await self._notify_pending_approvers(
            doc,
            notify_ids,
            actor_id=None,
            intro=f"{actor_name} напоминает: документ требует вашего согласования.",
        )
        return {"document_id": doc.id, "notified": len(notify_ids)}

    # ── Делегирование согласований ──

    async def create_delegation(
        self,
        user_id: int,
        delegate_id: int,
        days: int,
        actor_id: int,
    ) -> Dict[str, Any]:
        """Создать временное делегирование согласований user_id → delegate_id."""
        from app.modules.auth.models import User

        if delegate_id == user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Нельзя делегировать согласования самому себе",
            )
        if not 1 <= days <= 30:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Срок делегирования — от 1 до 30 дней",
            )
        delegate = await self.db.get(User, delegate_id)
        if delegate is None or not delegate.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Делегат не найден или деактивирован",
            )
        # Только сам пользователь или админ может делегировать его согласования.
        from app.modules.auth.deps import is_admin

        actor = await self.db.get(User, actor_id)
        if user_id != actor_id and not (actor and is_admin(actor)):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Можно делегировать только собственные согласования",
            )
        expires_at = datetime.now(timezone.utc) + timedelta(days=days)
        row = await self.delegation_repo.create(
            user_id=user_id,
            delegate_id=delegate_id,
            expires_at=expires_at,
            created_by_id=actor_id,
        )
        await self.notif_repo.create_and_notify(
            user_id=delegate_id,
            type="document_assigned",
            title="Вам делегированы согласования",
            message=(
                f"Пользователь делегировал вам свои согласования документов "
                f"на {days} дн. (до {expires_at.strftime('%d.%m.%Y')})."
            ),
            user_email=delegate.email,
            email_notifications_enabled=delegate.email_notifications_enabled,
            telegram_chat_id=delegate.telegram_chat_id,
            meta={},
        )
        return {
            "id": row.id,
            "user_id": row.user_id,
            "delegate_id": row.delegate_id,
            "expires_at": row.expires_at.isoformat(),
        }

    async def list_my_delegations(self, user_id: int) -> Dict[str, Any]:
        """Активные делегирования: свои (я делегировал) и входящие (мне)."""
        now = datetime.now(timezone.utc)
        rows = await self.delegation_repo.list_for_user(user_id, now)
        from app.modules.auth.models import User

        out = {"mine": [], "incoming": []}
        for row in rows:
            entry = {
                "id": row.id,
                "expires_at": row.expires_at.isoformat(),
            }
            other_id = (
                row.delegate_id if row.user_id == user_id else row.user_id
            )
            other = await self.db.get(User, other_id)
            entry["user_name"] = (
                (other.full_name if other else None) or f"Пользователь #{other_id}"
            )
            if row.user_id == user_id:
                entry["delegate_id"] = row.delegate_id
                out["mine"].append(entry)
            else:
                entry["user_id"] = row.user_id
                out["incoming"].append(entry)
        return out

    async def cancel_delegation(
        self, delegation_id: int, actor_id: int
    ) -> Dict[str, Any]:
        """Отменить делегирование (владелец, делегат или админ)."""
        from app.modules.auth.deps import is_admin
        from app.modules.auth.models import User

        row = await self.delegation_repo.get(delegation_id)
        if row is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Делегирование не найдено",
            )
        actor = await self.db.get(User, actor_id)
        allowed = actor_id in (row.user_id, row.delegate_id) or (
            actor is not None and is_admin(actor)
        )
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Отменить может владелец, делегат или администратор",
            )
        await self.delegation_repo.delete(row)
        return {"ok": True, "id": delegation_id}


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
