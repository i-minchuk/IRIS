"""Project Pydantic schemas."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


class ProjectCreate(BaseModel):
    """Schema for creating a project."""
    model_config = ConfigDict(from_attributes=True)

    name: str = Field(..., min_length=1, max_length=255)
    code: Optional[str] = Field(None, max_length=50)
    customer_name: Optional[str] = Field(None, max_length=255)
    contract_number: Optional[str] = Field(None, max_length=100)
    stage: Optional[str] = Field(default="draft", max_length=50)
    status: Optional[str] = Field(default="draft", max_length=50)
    standard_template_id: Optional[int] = None
    variables: Optional[dict] = Field(default_factory=dict)


class ProjectCreateResponse(BaseModel):
    """Response after creating a project."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: Optional[str] = None
    status: str


class StageCreate(BaseModel):
    """Schema for creating a stage."""
    model_config = ConfigDict(from_attributes=True)

    name: str = Field(..., min_length=1, max_length=255)
    code: Optional[str] = Field(None, max_length=50)
    sort_order: int = 0


class KitCreate(BaseModel):
    """Schema for creating a kit."""
    model_config = ConfigDict(from_attributes=True)

    name: str = Field(..., min_length=1, max_length=255)
    code: Optional[str] = Field(None, max_length=50)
    sort_order: int = 0


class SectionCreate(BaseModel):
    """Schema for creating a section."""
    model_config = ConfigDict(from_attributes=True)

    name: str = Field(..., min_length=1, max_length=255)
    code: Optional[str] = Field(None, max_length=50)
    sort_order: int = 0


class ProjectDetailResponse(BaseModel):
    """Full project response with stages tree."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    code: Optional[str] = None
    customer_name: Optional[str] = None
    contract_number: Optional[str] = None
    stage: str
    status: str
    variables: Optional[dict] = None
    created_at: Optional[str] = None
    stages: list[dict] = []


class StageResponse(BaseModel):
    """Stage response."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    code: Optional[str] = None


class KitResponse(BaseModel):
    """Kit response."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    code: Optional[str] = None


class SectionResponse(BaseModel):
    """Section response."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    code: Optional[str] = None
