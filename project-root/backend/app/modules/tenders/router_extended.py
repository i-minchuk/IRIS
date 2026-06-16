"""Extended tender API for tender specialist workspace.

Provides:
- Tender detail with related data (project, tasks, documents, procurement)
- Team availability analysis
- Production workload / work center capacity
- Reference library (similar past tenders)
- Document checklist and status
- Procurement / delivery status
"""
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_

from app.db.session import get_db
from app.modules.auth.deps import get_current_active_user
from app.modules.auth.models import User
from app.modules.tenders.models import Tender
from app.modules.projects.models import Project
from app.modules.tasks.models import Task
from app.modules.documents.models import Document
from app.modules.operations.models import WorkCenter, Operation
from app.modules.workflow.models import WorkflowInstance, WorkflowStep

router = APIRouter(tags=["tenders-extended"])


# ───────────────────────────────────────────────
# Helpers
# ───────────────────────────────────────────────

async def _get_tender_or_404(db: AsyncSession, tender_id: int) -> Tender:
    result = await db.execute(select(Tender).where(Tender.id == tender_id))
    tender = result.scalar_one_or_none()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
    return tender


# ───────────────────────────────────────────────
# 1. Tender Detail — full context
# ───────────────────────────────────────────────

@router.get("/{tender_id}/detail", response_model=dict)
async def get_tender_detail(
    tender_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Full tender detail with project, tasks, documents, and workflow status."""
    tender = await _get_tender_or_404(db, tender_id)

    # Linked project
    project = None
    if tender.project_id:
        proj_result = await db.execute(select(Project).where(Project.id == tender.project_id))
        p = proj_result.scalar_one_or_none()
        if p:
            project = {
                "id": p.id,
                "name": p.name,
                "code": p.code,
                "status": p.status,
                "stage": p.stage,
                "progress_pct": _estimate_project_progress(db, p.id),
            }

    # Tasks linked to the tender (via project or tender_id in task_data)
    # For JSON columns, use JSON operators instead of LIKE
    tasks = []
    if tender.project_id:
        tasks_result = await db.execute(
            select(Task).where(Task.project_id == tender.project_id).order_by(Task.due_date)
        )
        tasks = tasks_result.scalars().all()
    # Also search for tasks with tender_id in task_data (JSON)
    # Use PostgreSQL JSON containment operator @> or cast to text
    try:
        all_tasks_result = await db.execute(select(Task))
        all_tasks = all_tasks_result.scalars().all()
        for t in all_tasks:
            if t.task_data and isinstance(t.task_data, dict) and t.task_data.get("tender_id") == tender_id:
                if t not in tasks:
                    tasks.append(t)
    except Exception:
        pass

    # Documents linked to project
    documents = []
    if tender.project_id:
        doc_result = await db.execute(
            select(Document).where(Document.project_id == tender.project_id)
            .order_by(Document.created_at.desc())
        )
        docs = doc_result.scalars().all()
        documents = [
            {
                "id": d.id,
                "number": d.number,
                "name": d.name,
                "doc_type": d.doc_type,
                "status": d.status,
                "crs_code": d.crs_code,
                "created_at": d.created_at.isoformat() if d.created_at else None,
            }
            for d in docs
        ]

    # Workflow instances for this project
    workflows = []
    if tender.project_id:
        wf_result = await db.execute(
            select(WorkflowInstance).where(WorkflowInstance.project_id == tender.project_id)
        )
        wf_list = wf_result.scalars().all()
        for wf in wf_list:
            steps_result = await db.execute(
                select(WorkflowStep).where(WorkflowStep.instance_id == wf.id)
                .order_by(WorkflowStep.order_index)
            )
            steps = steps_result.scalars().all()
            workflows.append({
                "id": wf.id,
                "status": wf.status.value,
                "document_name": wf.document_name,
                "steps": [
                    {
                        "id": s.id,
                        "name": s.step_name,
                        "status": s.status.value,
                        "role": s.role,
                        "order": s.order_index,
                    }
                    for s in steps
                ],
            })

    return {
        "tender": {
            "id": tender.id,
            "name": tender.name,
            "customer_name": tender.customer_name,
            "project_type": tender.project_type,
            "volume": tender.volume,
            "volume_unit": tender.volume_unit,
            "complexity": tender.complexity,
            "standards": tender.standards,
            "stage": tender.stage,
            "status": tender.status,
            "nmc": tender.nmc,
            "our_price": tender.our_price,
            "margin_pct": tender.margin_pct,
            "probability": tender.probability,
            "platform": tender.platform,
            "region": tender.region,
            "deadline": tender.deadline.isoformat() if tender.deadline else None,
            "auction_end_time": tender.auction_end_time.isoformat() if tender.auction_end_time else None,
            "calculated_hours": tender.calculated_hours,
            "calculated_cost": tender.calculated_cost,
            "team_size": tender.team_size,
            "team_composition": tender.team_composition,
            "loss_reason": tender.loss_reason,
            "created_at": tender.created_at.isoformat() if tender.created_at else None,
        },
        "project": project,
        "tasks": [
            {
                "id": t.id,
                "title": t.title,
                "status": t.status,
                "priority": t.priority,
                "due_date": t.due_date.isoformat() if t.due_date else None,
                "assignee": t.assignee.full_name if t.assignee else None,
                "assignee_id": t.assignee_id,
                "percent_complete": t.percent_complete,
            }
            for t in tasks
        ],
        "documents": documents,
        "workflows": workflows,
    }


def _estimate_project_progress(db: AsyncSession, project_id: int) -> int:
    """Estimate project progress from tasks."""
    # Async can't be used in sync helper — return 0 for now
    # Frontend can calculate from tasks data
    return 0


# ───────────────────────────────────────────────
# 2. Team Availability — who is free and when
# ───────────────────────────────────────────────

@router.get("/{tender_id}/team-availability", response_model=dict)
async def get_team_availability(
    tender_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Analyze team availability for tender workload.
    
    Returns: all users with their current load, availability window,
    and recommendation for tender team assignment.
    """
    tender = await _get_tender_or_404(db, tender_id)

    # Get all active users
    users_result = await db.execute(
        select(User).where(User.is_active == True).order_by(User.role, User.full_name)
    )
    all_users = users_result.scalars().all()

    # Get active tasks for each user
    user_loads = []
    for user in all_users:
        tasks_result = await db.execute(
            select(Task).where(
                and_(
                    Task.assignee_id == user.id,
                    Task.status.in_(["in_progress", "pending", "on_hold"])
                )
            ).order_by(Task.due_date)
        )
        user_tasks = tasks_result.scalars().all()

        total_hours = sum(t.estimated_hours or 8 for t in user_tasks)
        active_count = len(user_tasks)

        # Find earliest availability date
        latest_due = max(
            (t.due_date for t in user_tasks if t.due_date),
            default=datetime.utcnow()
        )
        available_from = latest_due + timedelta(days=1)

        # Load classification
        capacity = 160  # hours per month
        load_pct = min(100, round(total_hours / capacity * 100))
        availability = "free" if load_pct < 30 else "partial" if load_pct < 80 else "busy"

        user_loads.append({
            "id": user.id,
            "full_name": user.full_name or user.username,
            "role": user.role,
            "department": _role_to_dept(user.role),
            "load_pct": load_pct,
            "availability": availability,
            "active_tasks": active_count,
            "total_hours_assigned": total_hours,
            "available_from": available_from.isoformat(),
            "skills": user.skills if hasattr(user, "skills") else [],
        })

    # Recommended team based on tender requirements
    recommended = []
    if tender.team_composition:
        for role, count in tender.team_composition.items():
            candidates = [u for u in user_loads if _match_role(u["role"], role)]
            candidates.sort(key=lambda x: x["load_pct"])
            recommended.append({
                "role": role,
                "needed": count,
                "candidates": candidates[:3],  # top 3 by load
            })

    return {
        "tender_id": tender_id,
        "tender_name": tender.name,
        "required_hours": tender.calculated_hours,
        "required_team_size": tender.team_size,
        "team_members": user_loads,
        "recommended_assignment": recommended,
    }


def _role_to_dept(role: str) -> str:
    mapping = {
        "engineer": "ПДО",
        "lead_engineer": "ПДО",
        "checker": "ОТК",
        "tech_editor": "ОТК",
        "manager": "Производство",
        "project_manager": "Производство",
        "procurement": "Снабжение",
        "logistics": "Логистика",
        "admin": "Администрация",
    }
    return mapping.get(role, "ПДО")


def _match_role(user_role: str, needed_role: str) -> bool:
    """Check if user role matches needed team role."""
    role_map = {
        "lead_engineer": ["lead_engineer", "engineer", "admin"],
        "engineer": ["engineer", "lead_engineer"],
        "checker": ["checker", "engineer"],
        "tech_editor": ["tech_editor", "engineer"],
    }
    compatible = role_map.get(needed_role, [needed_role])
    return user_role in compatible


# ───────────────────────────────────────────────
# 3. Production Capacity — work centers load
# ───────────────────────────────────────────────

@router.get("/{tender_id}/production-capacity", response_model=dict)
async def get_production_capacity(
    tender_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Analyze production capacity and work center availability."""
    tender = await _get_tender_or_404(db, tender_id)

    # Get all work centers
    wc_result = await db.execute(select(WorkCenter).where(WorkCenter.is_active == True))
    work_centers = wc_result.scalars().all()

    wc_data = []
    for wc in work_centers:
        # Count active operations in this work center
        ops_result = await db.execute(
            select(Operation).where(
                and_(
                    Operation.work_center_id == wc.id,
                    Operation.status.in_(["not_started", "in_progress", "on_hold"])
                )
            )
        )
        ops = ops_result.scalars().all()

        total_planned = sum(o.estimated_hours or 0 for o in ops)
        total_actual = sum(o.actual_hours or 0 for o in ops)
        active_count = len(ops)

        # Capacity: assume 160h per month per work center (1 unit)
        capacity = 160
        utilization = min(100, round((total_planned / capacity) * 100)) if capacity > 0 else 0

        wc_data.append({
            "id": wc.id,
            "code": wc.code,
            "name": wc.name,
            "type": wc.type,
            "utilization_pct": utilization,
            "active_operations": active_count,
            "planned_hours": total_planned,
            "actual_hours": total_actual,
            "capacity_hours": capacity,
            "manager": wc.manager.full_name if wc.manager else None,
        })

    # Estimate tender impact
    tender_hours = tender.calculated_hours or 0
    total_capacity = sum(wc["capacity_hours"] for wc in wc_data)
    total_utilized = sum(wc["planned_hours"] for wc in wc_data)
    remaining = total_capacity - total_utilized
    impact_pct = round((tender_hours / remaining) * 100, 1) if remaining > 0 else 999

    return {
        "tender_id": tender_id,
        "tender_hours": tender_hours,
        "work_centers": wc_data,
        "summary": {
            "total_capacity_hours": total_capacity,
            "total_utilized_hours": total_utilized,
            "remaining_hours": remaining,
            "tender_impact_pct": impact_pct,
            "risk": "high" if impact_pct > 80 else "medium" if impact_pct > 50 else "low",
        },
    }


# ───────────────────────────────────────────────
# 4. Document Checklist — what docs are needed
# ───────────────────────────────────────────────

DOCUMENT_CHECKLIST: Dict[str, List[Dict[str, Any]]] = {
    "KM": [
        {"code": "KM-01", "name": "Сборочный чертёж", "required": True, "category": "drawing"},
        {"code": "KM-02", "name": "Деталировка", "required": True, "category": "drawing"},
        {"code": "KM-03", "name": "Спецификация", "required": True, "category": "spec"},
        {"code": "KM-04", "name": "Ведомость расхода стали", "required": True, "category": "calc"},
        {"code": "KM-05", "name": "Расчётная записка", "required": True, "category": "calc"},
        {"code": "KM-06", "name": "Эскизный проект", "required": False, "category": "drawing"},
    ],
    "PD": [
        {"code": "PD-01", "name": "Пояснительная записка", "required": True, "category": "text"},
        {"code": "PD-02", "name": "Схема планировочная", "required": True, "category": "drawing"},
        {"code": "PD-03", "name": "Чертежи архитектурных решений", "required": True, "category": "drawing"},
        {"code": "PD-04", "name": "Спецификация оборудования", "required": True, "category": "spec"},
        {"code": "PD-05", "name": "Смета", "required": False, "category": "calc"},
    ],
    "AK": [
        {"code": "AK-01", "name": "Чертежи армирования", "required": True, "category": "drawing"},
        {"code": "AK-02", "name": "Ведомость арматуры", "required": True, "category": "spec"},
        {"code": "AK-03", "name": "Карта гибки", "required": True, "category": "drawing"},
    ],
    "montazh": [
        {"code": "MO-01", "name": "Монтажный чертёж", "required": True, "category": "drawing"},
        {"code": "MO-02", "name": "Технологическая карта", "required": True, "category": "text"},
        {"code": "MO-03", "name": "Схема строповки", "required": True, "category": "drawing"},
    ],
    "smety": [
        {"code": "SM-01", "name": "Смета на проектные работы", "required": True, "category": "calc"},
        {"code": "SM-02", "name": "Смета на изыскания", "required": False, "category": "calc"},
    ],
}


@router.get("/{tender_id}/document-checklist", response_model=dict)
async def get_document_checklist(
    tender_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get document checklist for tender with current status."""
    tender = await _get_tender_or_404(db, tender_id)

    project_type = tender.project_type or "KM"
    checklist = DOCUMENT_CHECKLIST.get(project_type, DOCUMENT_CHECKLIST["KM"])

    # Get existing documents for this tender's project
    existing_docs = []
    if tender.project_id:
        doc_result = await db.execute(
            select(Document).where(Document.project_id == tender.project_id)
        )
        existing_docs = doc_result.scalars().all()

    # Match checklist items with existing documents
    items = []
    for item in checklist:
        matched = [
            {
                "id": d.id,
                "number": d.number,
                "name": d.name,
                "status": d.status,
                "crs_code": d.crs_code,
            }
            for d in existing_docs
            if item["category"] in (d.doc_type or "") or item["code"] in (d.crs_code or "")
        ]
        items.append({
            **item,
            "status": "done" if matched else "pending",
            "documents": matched,
        })

    completed = sum(1 for i in items if i["status"] == "done" and i["required"])
    required = sum(1 for i in items if i["required"])
    progress_pct = round((completed / required) * 100) if required > 0 else 0

    return {
        "tender_id": tender_id,
        "project_type": project_type,
        "items": items,
        "summary": {
            "total": len(items),
            "required": required,
            "completed": completed,
            "progress_pct": progress_pct,
        },
    }


# ───────────────────────────────────────────────
# 5. Procurement Status — deliveries and inventory
# ───────────────────────────────────────────────

@router.get("/{tender_id}/procurement-status", response_model=dict)
async def get_procurement_status(
    tender_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get procurement status for tender — materials, equipment, delivery dates.
    
    Returns mock data structure for now (SRM integration placeholder).
    """
    tender = await _get_tender_or_404(db, tender_id)

    # In real implementation, this would query SRM/purchase orders
    # For now, return structured placeholder that frontend can render

    # Estimate materials from project type and volume
    materials = _estimate_materials(tender.project_type or "KM", tender.volume or 0)

    return {
        "tender_id": tender_id,
        "tender_name": tender.name,
        "materials": materials,
        "summary": {
            "total_items": len(materials),
            "ordered": sum(1 for m in materials if m["status"] in ["ordered", "delivered"]),
            "delivered": sum(1 for m in materials if m["status"] == "delivered"),
            "total_cost": sum(m["estimated_cost"] for m in materials),
        },
    }


def _estimate_materials(project_type: str, volume: float) -> List[Dict[str, Any]]:
    """Estimate required materials based on project type and volume."""
    if project_type in ["KM", "montazh"]:
        return [
            {
                "id": "mat-1",
                "name": "Прокат стальной (двутавр, швеллер)",
                "unit": "тонн",
                "quantity": round(volume * 0.85, 1),
                "status": "pending",
                "estimated_cost": round(volume * 0.85 * 65000),
                "supplier": None,
                "delivery_date": None,
                "warehouse_location": None,
            },
            {
                "id": "mat-2",
                "name": "Листовой прокат",
                "unit": "тонн",
                "quantity": round(volume * 0.15, 1),
                "status": "pending",
                "estimated_cost": round(volume * 0.15 * 58000),
                "supplier": None,
                "delivery_date": None,
                "warehouse_location": None,
            },
            {
                "id": "mat-3",
                "name": "Крепёжные изделия (болты, гайки)",
                "unit": "комплект",
                "quantity": max(1, int(volume / 10)),
                "status": "pending",
                "estimated_cost": max(1, int(volume / 10)) * 15000,
                "supplier": None,
                "delivery_date": None,
                "warehouse_location": None,
            },
        ]
    elif project_type == "PD":
        return [
            {
                "id": "mat-4",
                "name": "Бетон В25",
                "unit": "м³",
                "quantity": round(volume * 0.3, 1),
                "status": "pending",
                "estimated_cost": round(volume * 0.3 * 8500),
                "supplier": None,
                "delivery_date": None,
                "warehouse_location": None,
            },
            {
                "id": "mat-5",
                "name": "Арматура А500С",
                "unit": "тонн",
                "quantity": round(volume * 0.08, 1),
                "status": "pending",
                "estimated_cost": round(volume * 0.08 * 52000),
                "supplier": None,
                "delivery_date": None,
                "warehouse_location": None,
            },
        ]
    elif project_type == "AK":
        return [
            {
                "id": "mat-6",
                "name": "Арматура А500С",
                "unit": "тонн",
                "quantity": round(volume * 0.12, 1),
                "status": "pending",
                "estimated_cost": round(volume * 0.12 * 52000),
                "supplier": None,
                "delivery_date": None,
                "warehouse_location": None,
            },
            {
                "id": "mat-7",
                "name": "Бетон В30",
                "unit": "м³",
                "quantity": round(volume * 0.5, 1),
                "status": "pending",
                "estimated_cost": round(volume * 0.5 * 9000),
                "supplier": None,
                "delivery_date": None,
                "warehouse_location": None,
            },
        ]
    else:
        return [
            {
                "id": "mat-generic",
                "name": "Материалы (общая номенклатура)",
                "unit": "комплект",
                "quantity": 1,
                "status": "pending",
                "estimated_cost": int(volume * 50000),
                "supplier": None,
                "delivery_date": None,
                "warehouse_location": None,
            },
        ]


# ───────────────────────────────────────────────
# 6. Reference Library — similar past tenders
# ───────────────────────────────────────────────

@router.get("/{tender_id}/references", response_model=dict)
async def get_reference_tenders(
    tender_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Find similar past tenders (won/contract) for reference data."""
    tender = await _get_tender_or_404(db, tender_id)

    # Find tenders with same project type and similar volume
    result = await db.execute(
        select(Tender).where(
            and_(
                Tender.id != tender_id,
                Tender.project_type == tender.project_type,
                Tender.stage.in_(["won", "contract"]),
            )
        ).order_by(Tender.created_at.desc())
    )
    similar = result.scalars().all()

    # Filter by volume similarity (±50%)
    if tender.volume:
        similar = [t for t in similar if t.volume and 0.5 <= t.volume / tender.volume <= 1.5]

    references = []
    for t in similar[:10]:  # top 10
        references.append({
            "id": t.id,
            "name": t.name,
            "customer_name": t.customer_name,
            "volume": t.volume,
            "volume_unit": t.volume_unit,
            "nmc": t.nmc,
            "our_price": t.our_price,
            "margin_pct": t.margin_pct,
            "calculated_hours": t.calculated_hours,
            "team_size": t.team_size,
            "team_composition": t.team_composition,
            "duration_months": t.duration_months,
            "stage": t.stage,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "similarity_score": _calc_similarity(tender, t),
        })

    # Sort by similarity score
    references.sort(key=lambda x: x["similarity_score"], reverse=True)

    return {
        "tender_id": tender_id,
        "project_type": tender.project_type,
        "references": references,
        "stats": {
            "avg_margin": round(sum(r["margin_pct"] or 0 for r in references) / len(references), 1) if references else 0,
            "avg_hours": round(sum(r["calculated_hours"] or 0 for r in references) / len(references), 0) if references else 0,
            "avg_duration": round(sum(r["duration_months"] or 0 for r in references) / len(references), 1) if references else 0,
        },
    }


def _calc_similarity(t1: Tender, t2: Tender) -> int:
    """Calculate similarity score 0-100 between two tenders."""
    score = 50  # base for same project_type
    if t1.customer_name == t2.customer_name:
        score += 20
    if t1.volume and t2.volume:
        ratio = min(t1.volume, t2.volume) / max(t1.volume, t2.volume)
        score += int(ratio * 20)
    if t1.complexity == t2.complexity:
        score += 10
    return min(100, score)
