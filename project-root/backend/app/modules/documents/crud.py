"""Document CRUD operations."""
from typing import List, Optional
from uuid import UUID

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.documents.models import Document


async def get_documents(
    db: AsyncSession,
    project_id: Optional[UUID] = None,
    status: Optional[str] = None,
    document_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> List[Document]:
    """Get documents with optional filters."""
    query = select(Document)
    
    filters = []
    if project_id:
        filters.append(Document.project_id == project_id)
    if status:
        filters.append(Document.status == status)
    if document_type:
        filters.append(Document.document_type == document_type)
    
    if filters:
        query = query.where(and_(*filters))
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


async def get_document(db: AsyncSession, document_id: UUID) -> Optional[Document]:
    """Get a single document by ID."""
    result = await db.execute(select(Document).where(Document.id == document_id))
    return result.scalar_one_or_none()


async def create_document(db: AsyncSession, **kwargs) -> Document:
    """Create a new document."""
    document = Document(**kwargs)
    db.add(document)
    await db.commit()
    await db.refresh(document)
    return document


async def update_document(db: AsyncSession, document_id: UUID, **kwargs) -> Optional[Document]:
    """Update a document."""
    document = await get_document(db, document_id)
    if not document:
        return None
    
    for key, value in kwargs.items():
        if hasattr(document, key):
            setattr(document, key, value)
    
    await db.commit()
    await db.refresh(document)
    return document


async def delete_document(db: AsyncSession, document_id: UUID) -> bool:
    """Delete a document."""
    document = await get_document(db, document_id)
    if not document:
        return False
    
    await db.delete(document)
    await db.commit()
    return True
