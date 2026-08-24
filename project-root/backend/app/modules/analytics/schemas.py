"""Analytics Pydantic schemas."""
from pydantic import BaseModel, ConfigDict


class TeamTimeAnalytics(BaseModel):
    """Team time-tracking analytics per user."""
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    full_name: str
    total_sessions: int
    total_active_hours: float
    avg_efficiency: float
    quality_score: float
    speed_score: float
    bonus_points: int


class DepartmentEmployee(BaseModel):
    """Open-task load for a single employee."""

    name: str
    role: str
    current: int  # open tasks assigned
    max: int  # task norm per employee


class DepartmentLoadItem(BaseModel):
    """Workload of one department (grouped by user role)."""

    id: str  # role key (engineer/manager/admin/...)
    name: str  # display name
    current: int  # open tasks in the department
    max: int  # department norm (employees * per-employee norm)
    employees: list[DepartmentEmployee]


class DepartmentLoadData(BaseModel):
    """Response for GET /analytics/department-load."""

    departments: list[DepartmentLoadItem]
