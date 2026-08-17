"""Support API router: tickets, incidents, knowledge base."""
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.modules.auth.deps import get_current_active_user
from app.modules.auth.models import User
from app.modules.support.models import SupportTicket, Incident, KBArticle
from app.modules.support.schemas import (
    SupportTicketCreate,
    SupportTicketUpdate,
    SupportTicketResponse,
    IncidentCreate,
    IncidentUpdate,
    IncidentResponse,
    KBArticleCreate,
    KBArticleUpdate,
    KBArticleResponse,
)

router = APIRouter(tags=["support"])


# ---------- Tickets ----------


@router.get("/tickets", response_model=List[SupportTicketResponse])
async def list_tickets(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    query = select(SupportTicket)
    if status:
        query = query.where(SupportTicket.status == status)
    if priority:
        query = query.where(SupportTicket.priority == priority)
    query = query.order_by(SupportTicket.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/tickets/{ticket_id}", response_model=SupportTicketResponse)
async def get_ticket(
    ticket_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(select(SupportTicket).where(SupportTicket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@router.post("/tickets", response_model=SupportTicketResponse, status_code=201)
async def create_ticket(
    data: SupportTicketCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    ticket = SupportTicket(**data.model_dump())
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)
    return ticket


@router.patch("/tickets/{ticket_id}", response_model=SupportTicketResponse)
async def update_ticket(
    ticket_id: int,
    data: SupportTicketUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(select(SupportTicket).where(SupportTicket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    update_data = data.model_dump(exclude_unset=True)
    if update_data.get("status") in ("resolved", "closed") and ticket.resolved_at is None:
        update_data.setdefault("resolved_at", datetime.utcnow())
    for key, value in update_data.items():
        setattr(ticket, key, value)
    await db.commit()
    await db.refresh(ticket)
    return ticket


@router.delete("/tickets/{ticket_id}", status_code=204)
async def delete_ticket(
    ticket_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(select(SupportTicket).where(SupportTicket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    await db.delete(ticket)
    await db.commit()


# ---------- Incidents ----------


@router.get("/incidents", response_model=List[IncidentResponse])
async def list_incidents(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    query = select(Incident)
    if status:
        query = query.where(Incident.status == status)
    if severity:
        query = query.where(Incident.severity == severity)
    query = query.order_by(Incident.detected_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/incidents/{incident_id}", response_model=IncidentResponse)
async def get_incident(
    incident_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(select(Incident).where(Incident.id == incident_id))
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident


@router.post("/incidents", response_model=IncidentResponse, status_code=201)
async def create_incident(
    data: IncidentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    payload = data.model_dump()
    if payload.get("detected_at") is None:
        payload.pop("detected_at")
    incident = Incident(**payload)
    db.add(incident)
    await db.commit()
    await db.refresh(incident)
    return incident


@router.patch("/incidents/{incident_id}", response_model=IncidentResponse)
async def update_incident(
    incident_id: int,
    data: IncidentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(select(Incident).where(Incident.id == incident_id))
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    update_data = data.model_dump(exclude_unset=True)
    if update_data.get("status") == "resolved" and incident.resolved_at is None:
        update_data.setdefault("resolved_at", datetime.utcnow())
    for key, value in update_data.items():
        setattr(incident, key, value)
    await db.commit()
    await db.refresh(incident)
    return incident


@router.delete("/incidents/{incident_id}", status_code=204)
async def delete_incident(
    incident_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(select(Incident).where(Incident.id == incident_id))
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    await db.delete(incident)
    await db.commit()


# ---------- Knowledge base ----------


@router.get("/kb/articles", response_model=List[KBArticleResponse])
async def list_kb_articles(
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    query = select(KBArticle)
    if category:
        query = query.where(KBArticle.category == category)
    query = query.order_by(KBArticle.updated_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/kb/articles/{article_id}", response_model=KBArticleResponse)
async def get_kb_article(
    article_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(select(KBArticle).where(KBArticle.id == article_id))
    article = result.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    article.views = (article.views or 0) + 1
    await db.commit()
    await db.refresh(article)
    return article


@router.post("/kb/articles", response_model=KBArticleResponse, status_code=201)
async def create_kb_article(
    data: KBArticleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    article = KBArticle(**data.model_dump())
    db.add(article)
    await db.commit()
    await db.refresh(article)
    return article


@router.patch("/kb/articles/{article_id}", response_model=KBArticleResponse)
async def update_kb_article(
    article_id: int,
    data: KBArticleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(select(KBArticle).where(KBArticle.id == article_id))
    article = result.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(article, key, value)
    await db.commit()
    await db.refresh(article)
    return article


@router.delete("/kb/articles/{article_id}", status_code=204)
async def delete_kb_article(
    article_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(select(KBArticle).where(KBArticle.id == article_id))
    article = result.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    await db.delete(article)
    await db.commit()
