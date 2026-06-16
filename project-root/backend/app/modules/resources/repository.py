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
    
    async def get_all_users_with_stats(
        self,
        month_ago: datetime,
        week_starts: List[datetime],
        week_ends: List[datetime],
    ) -> List[Dict[str, Any]]:
        """Get all users with their stats, doc counts, active projects, and weekly hours in batch queries."""
        from sqlalchemy.orm import aliased
        
        # 1. Get all users
        users_result = await self.db.execute(select(User))
        users = users_result.scalars().all()
        if not users:
            return []
        
        user_ids = [u.id for u in users]
        
        # 2. Get stats for all users in one query
        stats_result = await self.db.execute(
            select(
                TimeSession.user_id,
                func.coalesce(func.sum(TimeSession.active_time), 0).label("active"),
                func.coalesce(func.avg(TimeSession.efficiency_score), 0).label("eff"),
                func.count().label("count"),
            ).where(
                and_(
                    TimeSession.user_id.in_(user_ids),
                    TimeSession.started_at >= month_ago,
                )
            ).group_by(TimeSession.user_id)
        )
        stats_map = {row.user_id: {"active": row.active or 0, "efficiency": row.eff or 0, "sessions_count": row.count or 0} for row in stats_result.all()}
        
        # 3. Get document counts for all users in one query
        doc_result = await self.db.execute(
            select(Document.author_id, func.count().label("count"))
            .where(Document.author_id.in_(user_ids))
            .group_by(Document.author_id)
        )
        doc_map = {row.author_id: row.count for row in doc_result.all()}
        
        # 4. Get active projects count for all users in one query
        proj_result = await self.db.execute(
            select(
                Document.author_id,
                func.count(func.distinct(Document.project_id)).label("count"),
            ).where(
                and_(
                    Document.author_id.in_(user_ids),
                    Document.status.in_(["draft", "in_review"]),
                )
            ).group_by(Document.author_id)
        )
        proj_map = {row.author_id: row.count for row in proj_result.all()}
        
        # 5. Get weekly hours for all users in one query per week
        weekly_hours_map: Dict[int, List[float]] = {uid: [] for uid in user_ids}
        for ws, we in zip(week_starts, week_ends):
            wh_result = await self.db.execute(
                select(
                    TimeSession.user_id,
                    func.coalesce(func.sum(TimeSession.active_time), 0).label("hours"),
                ).where(
                    and_(
                        TimeSession.user_id.in_(user_ids),
                        TimeSession.started_at >= ws,
                        TimeSession.started_at < we,
                    )
                ).group_by(TimeSession.user_id)
            )
            week_map = {row.user_id: (row.hours or 0) / 3600 for row in wh_result.all()}
            for uid in user_ids:
                weekly_hours_map[uid].append(week_map.get(uid, 0))
        
        # Assemble results
        results = []
        for user in users:
            uid = user.id
            weekly_load = []
            for i, (ws, we) in enumerate(zip(week_starts, week_ends)):
                hours = weekly_hours_map[uid][i]
                capacity = 40
                utilization = round(min(100, (hours / capacity) * 100), 1)
                status = "free" if utilization < 50 else "busy" if utilization < 100 else "overload"
                weekly_load.append({
                    "week": ws.strftime("%Y-W%W"),
                    "hours": round(hours, 1),
                    "capacity": capacity,
                    "utilization": utilization,
                    "status": status,
                })
            
            stats = stats_map.get(uid, {"active": 0, "efficiency": 0, "sessions_count": 0})
            results.append({
                "id": uid,
                "full_name": user.full_name or user.email,
                "role": user.role,
                "active_projects": proj_map.get(uid, 0),
                "documents_total": doc_map.get(uid, 0),
                "month_active_hours": round(stats["active"] / 3600, 1),
                "efficiency": round(stats["efficiency"] * 100, 1),
                "sessions_count": stats["sessions_count"],
                "weekly_load": weekly_load,
            })
        
        return results
    
    async def get_active_projects_with_team_size(self) -> List[Dict[str, Any]]:
        """Get active projects with team size in a single query."""
        result = await self.db.execute(
            select(
                Project.id,
                Project.name,
                Project.code,
                func.count(func.distinct(Document.author_id)).label("team_size"),
            )
            .outerjoin(Document, Document.project_id == Project.id)
            .where(Project.status.in_(["draft", "in_progress"]))
            .group_by(Project.id)
            .order_by(Project.name)
        )
        return [
            {
                "id": row.id,
                "name": row.name,
                "code": row.code,
                "team_size": row.team_size or 0,
            }
            for row in result.all()
        ]
