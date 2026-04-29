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
    stage: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    query = select(Tender)
    if status:
        query = query.where(Tender.status == status)
    if stage:
        query = query.where(Tender.stage == stage)
    result = await db.execute(query.order_by(Tender.created_at.desc()))
    tenders = result.scalars().all()
    return [
        {
            "id": t.id,
            "name": t.name,
            "customer_name": t.customer_name,
            "project_type": t.project_type,
            "status": t.status,
            "stage": t.stage,
            "nmc": t.nmc,
            "our_price": t.our_price,
            "margin_pct": t.margin_pct,
            "probability": t.probability,
            "platform": t.platform,
            "region": t.region,
            "deadline": t.deadline.isoformat() if t.deadline else None,
            "auction_end_time": t.auction_end_time.isoformat() if t.auction_end_time else None,
            "responsible_id": t.responsible_id,
            "calculated_cost": t.calculated_cost,
            "created_at": t.created_at.isoformat() if t.created_at else None,
        }
        for t in tenders
    ]


@router.get("/portfolio-summary", response_model=dict)
async def portfolio_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Summary KPI for tender portfolio dashboard."""
    result = await db.execute(select(Tender))
    tenders = result.scalars().all()

    active_stages = {"new", "qualification", "preparation", "approval", "submitted", "auction", "waiting"}
    active = [t for t in tenders if t.stage in active_stages]
    won = [t for t in tenders if t.stage == "won"]
    lost = [t for t in tenders if t.stage == "lost"]
    auction_now = [t for t in tenders if t.stage == "auction"]

    total_nmc = sum(t.nmc or 0 for t in active)
    total_won = sum(t.our_price or t.nmc or 0 for t in won)

    submitted_count = len([t for t in tenders if t.stage in ("submitted", "auction", "waiting", "won", "lost")])
    win_rate = round(len(won) / submitted_count * 100, 1) if submitted_count else 0

    pipeline = {}
    for stage in ["new", "qualification", "preparation", "approval", "submitted", "auction", "waiting", "won", "lost", "contract"]:
        stage_tenders = [t for t in tenders if t.stage == stage]
        pipeline[stage] = {
            "count": len(stage_tenders),
            "sum_nmc": sum(t.nmc or 0 for t in stage_tenders),
        }

    return {
        "active_count": len(active),
        "active_sum": round(total_nmc, 2),
        "won_count": len(won),
        "won_sum": round(total_won, 2),
        "win_rate": win_rate,
        "auction_now": len(auction_now),
        "pipeline": pipeline,
    }


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
        nmc=data.get("nmc"),
        our_price=data.get("our_price"),
        margin_pct=data.get("margin_pct"),
        probability=data.get("probability"),
        platform=data.get("platform"),
        region=data.get("region"),
        responsible_id=data.get("responsible_id"),
        auction_end_time=data.get("auction_end_time"),
        stage=data.get("stage", "new"),
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
        "stage": tender.stage,
        "calculated_cost": tender.calculated_cost,
    }


@router.patch("/{tender_id}/stage", response_model=dict)
async def update_tender_stage(
    tender_id: int,
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(select(Tender).where(Tender.id == tender_id))
    tender = result.scalar_one_or_none()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")
    if "stage" in data:
        tender.stage = data["stage"]
    if "status" in data:
        tender.status = data["status"]
    if "our_price" in data:
        tender.our_price = data["our_price"]
    if "margin_pct" in data:
        tender.margin_pct = data["margin_pct"]
    if "probability" in data:
        tender.probability = data["probability"]
    await db.commit()
    return {"id": tender.id, "stage": tender.stage, "status": tender.status}


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
        "nmc": tender.nmc,
        "our_price": tender.our_price,
        "margin_pct": tender.margin_pct,
        "probability": tender.probability,
        "platform": tender.platform,
        "region": tender.region,
        "responsible_id": tender.responsible_id,
        "auction_end_time": tender.auction_end_time.isoformat() if tender.auction_end_time else None,
        "stage": tender.stage,
        "loss_reason": tender.loss_reason,
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
