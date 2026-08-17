"""Releases API router."""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.modules.auth.deps import get_current_active_user
from app.modules.auth.models import User
from app.modules.releases.models import Release
from app.modules.releases.schemas import (
    ReleaseCreate,
    ReleaseResponse,
    ReleaseUpdate,
)

router = APIRouter(tags=["releases"])


@router.get("", response_model=List[ReleaseResponse])
async def list_releases(
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    query = select(Release)
    if status:
        query = query.where(Release.status == status)
    query = query.order_by(Release.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{release_id}", response_model=ReleaseResponse)
async def get_release(
    release_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(select(Release).where(Release.id == release_id))
    release = result.scalar_one_or_none()
    if not release:
        raise HTTPException(status_code=404, detail="Release not found")
    return release


@router.post("", response_model=ReleaseResponse, status_code=201)
async def create_release(
    data: ReleaseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    release = Release(
        version=data.version,
        name=data.name,
        branch=data.branch,
        status=data.status,
        description=data.description or "",
        checklist=[item.model_dump() for item in data.checklist],
        approved_by=data.approved_by,
        deployed_at=data.deployed_at,
        deployed_by=data.deployed_by,
        rollback_info=(
            data.rollback_info.model_dump(mode="json") if data.rollback_info else None
        ),
        planned_date=data.planned_date,
    )
    db.add(release)
    await db.commit()
    await db.refresh(release)
    return release


@router.patch("/{release_id}", response_model=ReleaseResponse)
async def update_release(
    release_id: int,
    data: ReleaseUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(Release).where(Release.id == release_id).with_for_update()
    )
    release = result.scalar_one_or_none()
    if not release:
        raise HTTPException(status_code=404, detail="Release not found")

    update_data = data.model_dump(exclude_unset=True)
    if "checklist" in update_data and update_data["checklist"] is not None:
        update_data["checklist"] = [
            item.model_dump() if hasattr(item, "model_dump") else item
            for item in update_data["checklist"]
        ]
    if "rollback_info" in update_data and update_data["rollback_info"] is not None:
        rollback_info = update_data["rollback_info"]
        if hasattr(rollback_info, "model_dump"):
            rollback_info = rollback_info.model_dump(mode="json")
        update_data["rollback_info"] = rollback_info

    for field, value in update_data.items():
        setattr(release, field, value)

    await db.commit()
    await db.refresh(release)
    return release


@router.delete("/{release_id}", status_code=204)
async def delete_release(
    release_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(select(Release).where(Release.id == release_id))
    release = result.scalar_one_or_none()
    if not release:
        raise HTTPException(status_code=404, detail="Release not found")
    await db.delete(release)
    await db.commit()
    return None
