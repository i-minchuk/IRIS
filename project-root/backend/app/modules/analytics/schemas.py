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
