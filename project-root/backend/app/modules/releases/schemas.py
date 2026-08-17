"""Release Pydantic schemas."""
from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, ConfigDict, field_validator

ReleaseStatus = Literal[
    "planning",
    "development",
    "testing",
    "staging",
    "ready",
    "deployed",
    "rolled_back",
]

ALLOWED_STATUSES = {
    "planning",
    "development",
    "testing",
    "staging",
    "ready",
    "deployed",
    "rolled_back",
}


class ChecklistItem(BaseModel):
    """Пункт чек-листа релиза."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    category: str
    text: str
    completed: bool = False
    required: bool = False
    assignee: Optional[str] = None


class RollbackInfo(BaseModel):
    """Информация об откате релиза."""

    model_config = ConfigDict(from_attributes=True)

    reason: str
    rolled_back_at: datetime
    rolled_back_by: str


class ReleaseBase(BaseModel):
    """Shared release fields."""

    model_config = ConfigDict(from_attributes=True)

    version: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=255)
    branch: str = Field(..., min_length=1, max_length=255)
    status: ReleaseStatus = "planning"
    description: Optional[str] = ""
    checklist: List[ChecklistItem] = Field(default_factory=list)
    approved_by: List[str] = Field(default_factory=list)
    deployed_at: Optional[datetime] = None
    deployed_by: Optional[str] = Field(None, max_length=255)
    rollback_info: Optional[RollbackInfo] = None
    planned_date: Optional[datetime] = None


class ReleaseCreate(ReleaseBase):
    """Schema for creating a new release."""


class ReleaseUpdate(BaseModel):
    """Schema for updating release fields (all optional)."""

    model_config = ConfigDict(from_attributes=True)

    version: Optional[str] = Field(None, min_length=1, max_length=50)
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    branch: Optional[str] = Field(None, min_length=1, max_length=255)
    status: Optional[ReleaseStatus] = None
    description: Optional[str] = None
    checklist: Optional[List[ChecklistItem]] = None
    approved_by: Optional[List[str]] = None
    deployed_at: Optional[datetime] = None
    deployed_by: Optional[str] = Field(None, max_length=255)
    rollback_info: Optional[RollbackInfo] = None
    planned_date: Optional[datetime] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        if v not in ALLOWED_STATUSES:
            raise ValueError(f"status must be one of {ALLOWED_STATUSES}")
        return v


class ReleaseResponse(BaseModel):
    """Full release response (matches frontend Release type)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    version: str
    name: str
    branch: str
    status: str
    description: Optional[str] = ""
    checklist: List[ChecklistItem] = Field(default_factory=list)
    checklist_progress: int = 0
    approved_by: List[str] = Field(default_factory=list)
    deployed_at: Optional[datetime] = None
    deployed_by: Optional[str] = None
    rollback_info: Optional[RollbackInfo] = None
    planned_date: Optional[datetime] = None
    created_at: datetime
