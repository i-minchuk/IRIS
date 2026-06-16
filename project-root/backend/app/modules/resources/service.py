"""Resources service - business logic layer for workload analytics."""

from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
from collections import OrderedDict
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.resources.repository import WorkloadRepository


class _BoundedCache:
    """LRU cache with TTL for workload data."""

    def __init__(self, max_size: int = 10, ttl_seconds: int = 300):
        self._cache: OrderedDict[str, Any] = OrderedDict()
        self._timestamp: Dict[str, datetime] = {}
        self._max_size = max_size
        self._ttl = ttl_seconds

    def _is_valid(self, key: str) -> bool:
        if key not in self._timestamp:
            return False
        age = (datetime.now(timezone.utc) - self._timestamp[key]).total_seconds()
        return age < self._ttl

    def get(self, key: str) -> Any | None:
        if key in self._cache and self._is_valid(key):
            # Move to end (LRU)
            self._cache.move_to_end(key)
            return self._cache[key]
        # Evict stale entry
        self._cache.pop(key, None)
        self._timestamp.pop(key, None)
        return None

    def set(self, key: str, value: Any) -> None:
        # Evict oldest if at capacity
        if len(self._cache) >= self._max_size and key not in self._cache:
            oldest = next(iter(self._cache))
            self._cache.pop(oldest)
            self._timestamp.pop(oldest)
        self._cache[key] = value
        self._timestamp[key] = datetime.now(timezone.utc)
        self._cache.move_to_end(key)

    def clear(self) -> None:
        self._cache.clear()
        self._timestamp.clear()


class WorkloadService:
    """Service for workload analytics business logic."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = WorkloadRepository(db)
        self._cache = _BoundedCache(max_size=10, ttl_seconds=300)

    @staticmethod
    def _generate_week_ranges(weeks_count: int = 4) -> List[Dict[str, str]]:
        """Generate ISO week ranges ending with the current week."""
        weeks = []
        today = datetime.now(timezone.utc).date()
        # Align to Monday of current week
        monday = today - timedelta(days=today.weekday())
        for i in range(weeks_count - 1, -1, -1):
            week_monday = monday - timedelta(weeks=i)
            week_sunday = week_monday + timedelta(days=6)
            label = week_monday.strftime("%Y-W%W")
            weeks.append({
                "label": label,
                "start": week_monday.isoformat(),
                "end": week_sunday.isoformat(),
            })
        return weeks

    @staticmethod
    def _calculate_utilization_status(utilization: float) -> str:
        """Return status based on utilization percentage."""
        if utilization < 50:
            return "free"
        if utilization < 100:
            return "busy"
        return "overload"

    async def get_team_workload(self) -> Dict[str, Any]:
        """Get comprehensive team workload analytics with caching."""
        cache_key = "workload_team"

        # Check cache
        cached = self._cache.get(cache_key)
        if cached is not None:
            return cached

        # Fetch data
        result = await self._fetch_workload_data()

        # Cache result
        self._cache.set(cache_key, result)

        return result

    async def _fetch_workload_data(self) -> Dict[str, Any]:
        """Actual data fetching logic — batch queries, no N+1."""
        # Generate week ranges
        weeks = self._generate_week_ranges()
        month_ago = datetime.now(timezone.utc) - timedelta(days=30)

        # Prepare week boundaries
        week_starts = [datetime.fromisoformat(w["start"]) for w in weeks]
        week_ends = [datetime.fromisoformat(w["end"]) + timedelta(days=1) for w in weeks]

        # Single batch query for all users + stats + docs + projects + weekly hours
        team = await self.repo.get_all_users_with_stats(month_ago, week_starts, week_ends)

        # Single batch query for active projects with team size
        projects_summary = await self.repo.get_active_projects_with_team_size()

        return {
            "weeks": [w["label"] for w in weeks],
            "team": team,
            "active_projects": projects_summary,
            "total_team_size": len(team),
        }
