"""Simple Documents API router for PostgreSQL MVP."""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.auth.deps import get_current_active_user
from app.modules.auth.models import User
from app.modules.documents import crud
from app.modules.documents.schemas import DocumentCreate, DocumentUpdate, DocumentResponse

router = APIRouter(tags=["Documents"])


@router.get("/", response_model=List[DocumentResponse])
async def list_documents(
    project_id: Optional[int] = Query(None, description="Filter by project ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    document_type: Optional[str] = Query(None, description="Filter by document type"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """List documents with optional filters."""
    documents = await crud.get_documents(
        db,
        project_id=project_id,
        status=status,
        document_type=document_type,
        skip=skip,
        limit=limit
    )
    return documents


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get a single document by ID."""
    document = await crud.get_document(db, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


@router.post("/", response_model=DocumentResponse, status_code=201)
async def create_document(
    data: DocumentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new document."""
    document = await crud.create_document(
        db,
        **data.model_dump()
    )
    return document


@router.patch("/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: int,
    data: DocumentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update a document."""
    # Filter out None values
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    document = await crud.update_document(db, document_id, **update_data)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


@router.delete("/{document_id}", status_code=204)
async def delete_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Delete a document."""
    success = await crud.delete_document(db, document_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")
    return None
