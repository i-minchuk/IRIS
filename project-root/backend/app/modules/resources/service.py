"""Resources service - business logic layer for workload analytics."""

from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.resources.repository import WorkloadRepository


class WorkloadService:
    """Service for workload analytics business logic."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = WorkloadRepository(db)
        self._cache: Dict[str, Any] = {}
        self._cache_timestamp: Dict[str, datetime] = {}
        self._CACHE_TTL = 300  # 5 minutes
    
    def _is_cache_valid(self, key: str) -> bool:
        """Check if cache entry is still valid."""
        if key not in self._cache_timestamp:
            return False
        age = (datetime.utcnow() - self._cache_timestamp[key]).total_seconds()
        return age < self._CACHE_TTL
    
    async def get_team_workload(self) -> Dict[str, Any]:
        """Get comprehensive team workload analytics with caching."""
        cache_key = "workload_team"
        
        # Check cache
        if cache_key in self._cache and self._is_cache_valid(cache_key):
            return self._cache[cache_key]
        
        # Fetch data
        result = await self._fetch_workload_data()
        
        # Cache result
        self._cache[cache_key] = result
        self._cache_timestamp[cache_key] = datetime.utcnow()
        
        return result
    
    async def _fetch_workload_data(self) -> Dict[str, Any]:
        """Actual data fetching logic."""
        # Generate week ranges
        weeks = self._generate_week_ranges()
        
        # Get all users
        users = await self.repo.get_all_users()
        
        # Calculate stats for each user
        team = []
        month_ago = datetime.utcnow() - timedelta(days=30)
        
        for user in users:
            # Get user stats
            stats = await self.repo.get_user_stats(user.id, month_ago)
            
            # Get documents count
            doc_count = await self.repo.get_user_documents_count(user.id)
            
            # Get active projects count
            active_projects = await self.repo.get_user_active_projects_count(user.id)
            
            # Calculate weekly load
            weekly_load = []
            for w in weeks:
                ws = datetime.fromisoformat(w["start"])
                we = datetime.fromisoformat(w["end"]) + timedelta(days=1)
                
                hours = await self.repo.get_user_weekly_hours(user.id, ws, we)
                capacity = 40  # standard week
                utilization = round(min(100, (hours / capacity) * 100), 1)
                status = self._calculate_utilization_status(utilization)
                
                weekly_load.append({
                    "week": w["label"],
                    "hours": round(hours, 1),
                    "capacity": capacity,
                    "utilization": utilization,
                    "status": status,
                })
            
            team.append({
                "id": user.id,
                "full_name": user.full_name or user.email,
                "role": user.role,
                "active_projects": active_projects,
                "documents_total": doc_count,
                "month_active_hours": round((stats["active"]) / 3600, 1),
                "efficiency": round((stats["efficiency"]) * 100, 1),
                "sessions_count": stats["sessions_count"],
                "weekly_load": weekly_load,
            })
        
        # Get project summary
        active_projects = await self.repo.get_active_projects()
        projects_summary = []
        for p in active_projects:
            team_size = await self.repo.get_project_team_size(p.id)
            projects_summary.append({
                "id": p.id,
                "name": p.name,
                "code": p.code,
                "team_size": team_size,
            })
        
        return {
            "weeks": [w["label"] for w in weeks],
            "team": team,
            "active_projects": projects_summary,
            "total_team_size": len(users),
        }
