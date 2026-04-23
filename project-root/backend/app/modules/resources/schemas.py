"""Resources Pydantic schemas."""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# Weekly load schema
class WeeklyLoad(BaseModel):
    """Weekly workload for a user."""
    week: str
    hours: float
    capacity: int
    utilization: float
    status: str = Field(..., pattern="^(free|busy|overload)$")


# User workload schema
class UserWorkload(BaseModel):
    """User workload statistics."""
    id: int
    full_name: str
    role: str
    active_projects: int
    documents_total: int
    month_active_hours: float
    efficiency: float
    sessions_count: int
    weekly_load: List[WeeklyLoad]


# Project summary schema
class ProjectSummary(BaseModel):
    """Project summary for workload report."""
    id: int
    name: str
    code: str
    team_size: int


# Workload response schema
class WorkloadResponse(BaseModel):
    """Team workload analytics response."""
    weeks: List[str]
    team: List[UserWorkload]
    active_projects: List[ProjectSummary]
    total_team_size: int
    
    class Config:
        from_attributes = True
