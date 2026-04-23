"""Resources and workload API."""

from fastapi import APIRouter, Depends

from app.modules.resources.service import WorkloadService
from app.modules.resources.deps import get_workload_service
from app.modules.resources.schemas import WorkloadResponse

router = APIRouter(tags=["resources"])


@router.get("/workload", response_model=WorkloadResponse)
async def get_workload(
    service: WorkloadService = Depends(get_workload_service),
):
    """Return team workload: users, weekly load, capacity, active projects."""
    return await service.get_team_workload()
