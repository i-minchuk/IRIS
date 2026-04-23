"""Resources dependencies for FastAPI dependency injection."""

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.resources.service import WorkloadService


async def get_workload_service(
    db: AsyncSession = Depends(get_db)
) -> WorkloadService:
    """Get workload service instance."""
    return WorkloadService(db)
