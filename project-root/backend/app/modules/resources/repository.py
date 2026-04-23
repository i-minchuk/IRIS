"""Resources repository - data access layer for workload analytics."""

from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.models import User
from app.modules.time_tracking.models import TimeSession
from app.modules.documents.models import Document
from app.modules.projects.models import Project


class WorkloadRepository:
    """Repository for workload analytics operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_all_users(self) -> List[User]:
        """Get all users."""
        result = await self.db.execute(select(User))
        return result.scalars().all()
    
    async def get_user_stats(
        self, 
        user_id: int, 
        month_ago: datetime
    ) -> Dict[str, Any]:
        """Get user statistics for last 30 days."""
        result = await self.db.execute(
            select(
                func.coalesce(func.sum(TimeSession.active_time), 0).label("active"),
                func.coalesce(func.avg(TimeSession.efficiency_score), 0).label("eff"),
                func.count().label("count"),
            ).where(
                and_(
                    TimeSession.user_id == user_id,
                    TimeSession.started_at >= month_ago,
                )
            )
        )
        sess = result.mappings().one()
        
        return {
            "active": sess.active or 0,
            "efficiency": sess.eff or 0,
            "sessions_count": sess.count or 0,
        }
    
    async def get_user_documents_count(self, user_id: int) -> int:
        """Get total documents authored by user."""
        result = await self.db.execute(
            select(func.count()).where(Document.author_id == user_id)
        )
        return result.scalar() or 0
    
    async def get_user_active_projects_count(self, user_id: int) -> int:
        """Get count of active projects where user is author or checker."""
        result = await self.db.execute(
            select(func.count(func.distinct(Document.project_id))).where(
                and_(
                    or_(Document.author_id == user_id, Document.checker_id == user_id),
                    Document.status.in_(["draft", "in_review"]),
                )
            )
        )
        return result.scalar() or 0
    
    async def get_user_weekly_hours(
        self, 
        user_id: int, 
        week_start: datetime, 
        week_end: datetime
    ) -> float:
        """Get user's active hours for a specific week."""
        result = await self.db.execute(
            select(func.coalesce(func.sum(TimeSession.active_time), 0)).where(
                and_(
                    TimeSession.user_id == user_id,
                    TimeSession.started_at >= week_start,
                    TimeSession.started_at < week_end,
                )
            )
        )
        return (result.scalar() or 0) / 3600  # Convert to hours
    
    async def get_active_projects(self) -> List[Project]:
        """Get all active projects."""
        result = await self.db.execute(
            select(Project).where(Project.status.in_(["draft", "in_progress"]))
        )
        return result.scalars().all()
    
    async def get_project_team_size(self, project_id: int) -> int:
        """Get unique team size for a project."""
        result = await self.db.execute(
            select(func.count(func.distinct(Document.author_id))).where(
                Document.project_id == project_id
            )
        )
        return result.scalar() or 0
