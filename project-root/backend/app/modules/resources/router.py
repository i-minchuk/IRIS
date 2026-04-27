"""Resources and workload API."""

from datetime import datetime
from fastapi import APIRouter, Depends

from app.modules.resources.service import WorkloadService
from app.modules.resources.deps import get_workload_service
from app.modules.resources.schemas import WorkloadResponse, HeatmapResponse

router = APIRouter(tags=["resources"])


@router.get("/workload", response_model=WorkloadResponse)
async def get_workload(
    service: WorkloadService = Depends(get_workload_service),
):
    """Return team workload: users, weekly load, capacity, active projects."""
    return await service.get_team_workload()


@router.get("/heatmap", response_model=HeatmapResponse)
async def get_heatmap(
    service: WorkloadService = Depends(get_workload_service),
):
    """Return department-grouped employee load for heatmap visualization."""
    workload = await service.get_team_workload()
    
    # Map roles to departments
    dept_map = {
        "engineer": "ПДО",
        "manager": "Производство",
        "norm_controller": "ОТК",
        "admin": "Тендерный",
    }
    
    dept_groups: dict[str, list] = {}
    for member in workload.get("team", []):
        dept = dept_map.get(member["role"], "ПДО")
        # Use latest week utilization as current load
        weekly = member.get("weekly_load", [])
        load = int(weekly[-1]["utilization"]) if weekly else 70
        
        # Generate project names from active projects
        projects = [f"ПРО-{i+1:03d}" for i in range(member.get("active_projects", 1))]
        
        cell = {
            "id": member["id"],
            "name": member["full_name"].split()[0] if member["full_name"] else "Сотрудник",
            "load": load,
            "projects": projects,
        }
        dept_groups.setdefault(dept, []).append(cell)
    
    # Ensure all departments exist
    for dept in ["ПДО", "Производство", "ОТК", "Тендерный", "Снабжение", "Логистика"]:
        if dept not in dept_groups:
            dept_groups[dept] = []
    
    departments = [
        {"dept": dept, "employees": employees}
        for dept, employees in dept_groups.items()
        if employees
    ]
    
    return {
        "departments": departments,
        "updated_at": datetime.utcnow().isoformat(),
    }
