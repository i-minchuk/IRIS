"""Remark API endpoints."""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
import csv
import io

from app.db.session import get_db
from app.modules.auth.deps import get_current_active_user
from app.modules.auth.models import User
from app.modules.remarks.service import RemarkService
from app.modules.remarks.schemas import (
    RemarkCreate,
    RemarkUpdate,
    RemarkFilter,
    RemarkAction,
    RemarkResponse,
    RemarkListResponse,
    RemarkListItem,
    RemarkCommentCreate,
    RemarkCommentResponse,
    RemarkStatistics,
    RemarkTagCreate,
    RemarkTagResponse,
    RemarkExportRow
)

router = APIRouter(prefix="/remarks", tags=["remarks"])


def get_service(db: AsyncSession) -> RemarkService:
    """Get remark service."""
    return RemarkService(db)


# ==================== Remark Endpoints ====================

@router.post("", response_model=RemarkResponse, status_code=status.HTTP_201_CREATED)
async def create_remark(
    remark_data: RemarkCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new remark."""
    service = get_service(db)
    remark = await service.create_remark(remark_data, current_user.id)
    return remark


@router.get("", response_model=RemarkListResponse)
async def list_remarks(
    project_id: Optional[int] = Query(None),
    document_id: Optional[int] = Query(None),
    status: Optional[List[str]] = Query(None),
    priority: Optional[List[str]] = Query(None),
    category: Optional[List[str]] = Query(None),
    source: Optional[List[str]] = Query(None),
    assignee_id: Optional[int] = Query(None),
    author_id: Optional[int] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    search_text: Optional[str] = Query(None),
    tag_ids: Optional[List[int]] = Query(None),
    sort_by: str = Query("priority"),
    sort_order: str = Query("desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List remarks with filtering."""
    service = get_service(db)
    
    # Parse filters
    from datetime import datetime
    from app.modules.remarks.models import RemarkStatus, RemarkPriority, RemarkCategory, RemarkSource
    
    filters = RemarkFilter(
        project_id=project_id,
        document_id=document_id,
        status=[RemarkStatus(s) for s in status] if status else None,
        priority=[RemarkPriority(p) for p in priority] if priority else None,
        category=[RemarkCategory(c) for c in category] if category else None,
        source=[RemarkSource(s) for s in source] if source else None,
        assignee_id=assignee_id,
        author_id=author_id,
        date_from=datetime.fromisoformat(date_from) if date_from else None,
        date_to=datetime.fromisoformat(date_to) if date_to else None,
        search_text=search_text,
        tag_ids=tag_ids,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size
    )
    
    remarks, total = await service.list_remarks(filters, current_user.id)
    
    return RemarkListResponse(
        remarks=[RemarkListItem.model_validate(r) for r in remarks],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{remark_id}", response_model=RemarkResponse)
async def get_remark(
    remark_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get remark by ID."""
    service = get_service(db)
    remark = await service.get_remark(remark_id)
    
    if not remark:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Remark not found"
        )
    
    return remark


@router.put("/{remark_id}", response_model=RemarkResponse)
async def update_remark(
    remark_id: UUID,
    update_data: RemarkUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update remark."""
    service = get_service(db)
    remark = await service.update_remark(remark_id, update_data, current_user.id)
    
    if not remark:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Remark not found"
        )
    
    return remark


@router.delete("/{remark_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_remark(
    remark_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete remark."""
    service = get_service(db)
    success = await service.delete_remark(remark_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Remark not found"
        )


# ==================== Comment Endpoints ====================

@router.post("/{remark_id}/comments", response_model=RemarkCommentResponse, status_code=status.HTTP_201_CREATED)
async def add_comment(
    remark_id: UUID,
    comment_data: RemarkCommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Add comment to remark."""
    service = get_service(db)
    comment = await service.add_comment(
        remark_id,
        comment_data.text,
        current_user.id,
        comment_data.is_internal
    )
    
    return RemarkCommentResponse(
        id=comment.id,
        remark_id=comment.remark_id,
        author_id=comment.author_id,
        author_name=current_user.email,  # TODO: Get actual name
        text=comment.text,
        is_internal=comment.is_internal,
        created_at=comment.created_at,
        updated_at=comment.updated_at
    )


@router.delete("/{remark_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    remark_id: UUID,
    comment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete comment."""
    service = get_service(db)
    success = await service.delete_comment(remark_id, comment_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )


# ==================== Action Endpoints ====================

@router.post("/{remark_id}/actions", response_model=dict)
async def perform_action(
    remark_id: UUID,
    action_data: RemarkAction,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Perform action on remark."""
    service = get_service(db)
    
    try:
        remark = await service.perform_action(remark_id, action_data, current_user.id)
        
        if not remark:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Remark not found"
            )
        
        return {
            "success": True,
            "action": action_data.action,
            "remark_id": str(remark.id),
            "new_status": remark.status.value
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{remark_id}/link/{related_id}", response_model=dict)
async def link_remarks(
    remark_id: UUID,
    related_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Link two remarks."""
    service = get_service(db)
    success = await service.link_remarks(remark_id, related_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Remark not found"
        )
    
    return {"success": True, "linked": [str(remark_id), str(related_id)]}


# ==================== Statistics Endpoint ====================

@router.get("/statistics", response_model=RemarkStatistics)
async def get_statistics(
    project_id: Optional[int] = Query(None),
    document_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get remarks statistics."""
    service = get_service(db)
    stats = await service.get_statistics(project_id, document_id, current_user.id)
    return stats


# ==================== Export Endpoint ====================

@router.get("/export")
async def export_remarks(
    project_id: Optional[int] = Query(None),
    document_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Export remarks to CSV."""
    service = get_service(db)
    
    from app.modules.remarks.models import Remark
    from sqlalchemy import select
    
    query = select(Remark)
    if project_id:
        query = query.where(Remark.project_id == project_id)
    if document_id:
        query = query.where(Remark.document_id == document_id)
    
    result = await self.db.execute(query)
    remarks = result.scalars().all()
    
    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        'ID', 'Title', 'Status', 'Priority', 'Category', 'Source',
        'Project', 'Document', 'Location', 'Author', 'Assignee',
        'Due Date', 'Resolution', 'Created', 'Updated'
    ])
    
    # Rows
    for remark in remarks:
        writer.writerow([
            str(remark.id),
            remark.title,
            remark.status.value,
            remark.priority.value,
            remark.category.value,
            remark.source.value,
            remark.project.name if remark.project else '',
            remark.document.name if remark.document else '',
            remark.location_ref or '',
            remark.author.email,
            remark.assignee.email if remark.assignee else '',
            remark.due_date.isoformat() if remark.due_date else '',
            remark.resolution or '',
            remark.created_at.isoformat(),
            remark.updated_at.isoformat()
        ])
    
    output.seek(0)
    
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=remarks_export.csv"}
    )


# ==================== Tag Endpoints ====================

@router.get("/tags", response_model=List[RemarkTagResponse])
async def list_tags(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List all tags."""
    service = get_service(db)
    tags = await service.list_tags()
    return [RemarkTagResponse.model_validate(t) for t in tags]


@router.post("/tags", response_model=RemarkTagResponse, status_code=status.HTTP_201_CREATED)
async def create_tag(
    tag_data: RemarkTagCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new tag."""
    service = get_service(db)
    tag = await service.create_tag(tag_data.name, tag_data.color, current_user.id)
    return RemarkTagResponse.model_validate(tag)


@router.delete("/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(
    tag_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete tag."""
    service = get_service(db)
    success = await service.delete_tag(tag_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found"
        )
