"""Document CRUD operations."""
from typing import List, Optional
from uuid import UUID

from sqlalchemy import select, and_, or_, cast, String
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.documents.models import Document


def user_document_access_clause(user_id: int):
    """SQL-условие: документ доступен пользователю по привязке.

    Свой документ — если пользователь автор, проверяющий, утверждающий
    или назначен исполнителем (assignee_ids, JSON-список id).
    Работает и на PostgreSQL, и на SQLite (текстовое сравнение JSON).
    """
    text = cast(Document.assignee_ids, String)
    patterns = [
        f"%[{user_id},%",   # первый элемент: [5, ...] или [5,...]
        f"%,{user_id},%",    # середина: [...,5,...]
        f"%, {user_id},%",   # середина с пробелом: [..., 5, ...]
        f"%,{user_id}]%",    # последний: [...,5]
        f"%, {user_id}]%",   # последний с пробелом: [..., 5]
        f"%[{user_id}]%",    # единственный элемент: [5]
    ]
    return or_(
        Document.author_id == user_id,
        Document.checker_id == user_id,
        Document.approver_id == user_id,
        *[text.like(p) for p in patterns],
    )


async def get_documents(
    db: AsyncSession,
    project_id: Optional[int] = None,
    status: Optional[str] = None,
    document_type: Optional[str] = None,
    include_deleted: bool = False,
    skip: int = 0,
    limit: int = 100,
    access_clause=None,
) -> List[Document]:
    """Get documents with optional filters."""
    query = select(Document)

    filters = []
    if not include_deleted:
        filters.append(Document.is_deleted.is_(False))
    if project_id:
        filters.append(Document.project_id == project_id)
    if status:
        filters.append(Document.status == status)
    if document_type:
        filters.append(Document.doc_type == document_type)
    if access_clause is not None:
        filters.append(access_clause)

    if filters:
        query = query.where(and_(*filters))

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


def user_has_document_access(doc: Document, user_id: int) -> bool:
    """Python-проверка доступа к конкретному документу (для GET-одиночных)."""
    assignees = doc.assignee_ids or []
    return (
        user_id in assignees
        or doc.author_id == user_id
        or doc.checker_id == user_id
        or doc.approver_id == user_id
    )


async def get_document(db: AsyncSession, document_id: int) -> Optional[Document]:
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


async def update_document(db: AsyncSession, document_id: int, **kwargs) -> Optional[Document]:
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


async def delete_document(db: AsyncSession, document_id: int) -> bool:
    """Delete a document."""
    document = await get_document(db, document_id)
    if not document:
        return False
    
    await db.delete(document)
    await db.commit()
    return True
