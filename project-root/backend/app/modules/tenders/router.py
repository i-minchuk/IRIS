"""Tenders API router."""
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.modules.auth.deps import get_current_active_user
from app.modules.auth.models import User
from app.modules.tenders.models import Tender, TenderDocumentPreview
from app.modules.tenders.calculator import calculate_tender

router = APIRouter(tags=["tenders"])


@router.get("", response_model=list)
async def list_tenders(
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    query = select(Tender)
    if status:
        query = query.where(Tender.status == status)
    result = await db.execute(query.order_by(Tender.created_at.desc()))
    tenders = result.scalars().all()
    return [
        {
            "id": t.id,
            "name": t.name,
            "customer_name": t.customer_name,
            "project_type": t.project_type,
            "status": t.status,
            "calculated_cost": t.calculated_cost,
            "created_at": t.created_at.isoformat() if t.created_at else None,
        }
        for t in tenders
    ]


@router.post("", response_model=dict)
async def create_tender(
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    tender = Tender(
        name=data.get("name"),
        customer_name=data.get("customer_name"),
        project_type=data.get("project_type"),
        volume=data.get("volume"),
        volume_unit=data.get("volume_unit"),
        complexity=data.get("complexity", "medium"),
        standards=data.get("standards", []),
        start_date=data.get("start_date"),
        deadline=data.get("deadline"),
        duration_months=data.get("duration_months"),
        calculated_hours=data.get("calculated_hours"),
        calculated_cost=data.get("calculated_cost"),
        team_size=data.get("team_size"),
        team_composition=data.get("team_composition", {}),
        status="draft",
        created_by_id=current_user.id,
    )
    db.add(tender)
    await db.commit()
    await db.refresh(tender)
    return {
        "id": tender.id,
        "name": tender.name,
        "status": tender.status,
        "calculated_cost": tender.calculated_cost,
    }


@router.get("/{tender_id}", response_model=dict)
async def get_tender(
    tender_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(select(Tender).where(Tender.id == tender_id))
    tender = result.scalar_one_or_none()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
    return {
        "id": tender.id,
        "name": tender.name,
        "customer_name": tender.customer_name,
        "project_type": tender.project_type,
        "volume": tender.volume,
        "complexity": tender.complexity,
        "standards": tender.standards,
        "start_date": tender.start_date.isoformat() if tender.start_date else None,
        "deadline": tender.deadline.isoformat() if tender.deadline else None,
        "duration_months": tender.duration_months,
        "calculated_hours": tender.calculated_hours,
        "calculated_cost": tender.calculated_cost,
        "team_size": tender.team_size,
        "team_composition": tender.team_composition,
        "status": tender.status,
        "created_at": tender.created_at.isoformat() if tender.created_at else None,
    }


@router.post("/{tender_id}/generate-preview", response_model=dict)
async def generate_preview(
    tender_id: int,
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    preview = TenderDocumentPreview(
        tender_id=tender_id,
        doc_type=data.get("doc_type"),
        name=data.get("name"),
        format=data.get("format", "pdf"),
        content_data=data.get("content_data", {}),
        preview_url=data.get("preview_url"),
    )
    db.add(preview)
    await db.commit()
    await db.refresh(preview)
    return {"id": preview.id, "doc_type": preview.doc_type, "name": preview.name}


@router.post("/{tender_id}/calculate", response_model=dict)
async def calculate_tender_endpoint(
    tender_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Calculate workload, team and load chart for a tender."""
    result = await db.execute(select(Tender).where(Tender.id == tender_id))
    tender = result.scalar_one_or_none()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")

    calc = calculate_tender(
        project_type=tender.project_type or "KM",
        volume=tender.volume or 0,
        volume_unit=tender.volume_unit or "ton",
        complexity=tender.complexity or "medium",
        standards=tender.standards or [],
        duration_months=tender.duration_months,
    )

    # Update tender with calculated values
    tender.calculated_hours = calc["total_hours"]
    tender.team_size = calc["team_size"]
    tender.team_composition = calc["team_composition"]
    tender.duration_months = calc["duration_months"]
    await db.commit()

    return {
        "tender_id": tender.id,
        "name": tender.name,
        **calc,
    }
