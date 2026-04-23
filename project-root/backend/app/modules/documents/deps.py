"""Documents dependencies for FastAPI dependency injection."""

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.documents.service import DocumentService


async def get_document_service(
    db: AsyncSession = Depends(get_db)
) -> DocumentService:
    """Get document service instance."""
    return DocumentService(db)
