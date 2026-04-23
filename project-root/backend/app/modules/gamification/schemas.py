# app/modules/gamification/schemas.py
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class BadgeDefinition(BaseModel):
    id: str
    name: str
    description: str
    icon: Optional[str] = None


class GamificationProfile(BaseModel):
    score: int
    xp: int
    level: int
    level_title: str
    next_level_at: Optional[int] = None
    badges: list[str] = []


class LeaderboardEntry(BaseModel):
    user_id: int
    username: str
    full_name: str
    score: int
    rank: int


class QuestResponse(BaseModel):
    id: int
    quest_type: str
    title: str
    description: str
    target_count: int
    current_count: int
    reward_points: int
    reward_xp: int
    is_completed: bool
    completed_at: Optional[datetime] = None


class NotificationResponse(BaseModel):
    id: int
    type: str
    title: str
    message: str
    is_read: bool
    created_at: datetime


class EventCreate(BaseModel):
    user_id: int
    event_type: str
    points_delta: int = 0
    xp_delta: int = 0
    project_id: Optional[int] = None
    ref_doc_id: Optional[int] = None
    ref_task_id: Optional[int] = None
    comment: Optional[str] = None
