"""Variable Pydantic schemas."""
from datetime import datetime
from typing import Optional, Literal

from pydantic import BaseModel, Field, ConfigDict


class VariableBase(BaseModel):
    """Shared variable fields."""
    model_config = ConfigDict(from_attributes=True)

    scope: Literal["global", "project", "document"] = "project"
    project_id: Optional[int] = None
    document_id: Optional[int] = None
    key: str = Field(..., min_length=1, max_length=100)
    value: Optional[str] = None
    default_value: Optional[str] = None
    description: Optional[str] = None
    validation_rule: Optional[str] = Field(None, max_length=255)
    is_computed: bool = False
    computed_expression: Optional[str] = None


class VariableCreate(VariableBase):
    """Schema for creating a variable."""
    pass


class VariableUpdate(BaseModel):
    """Schema for updating a variable value."""
    model_config = ConfigDict(from_attributes=True)

    value: Optional[str] = None
    reason: Optional[str] = None
    triggered_by: Optional[str] = Field(None, max_length=100)


class VariableSubstitute(BaseModel):
    """Schema for variable substitution request."""
    model_config = ConfigDict(from_attributes=True)

    template: str = Field(..., min_length=1)


class VariableListItem(BaseModel):
    """Schema for list response."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    scope: str
    project_id: Optional[int] = None
    document_id: Optional[int] = None
    key: str
    value: Optional[str] = None
    default_value: Optional[str] = None
    is_computed: bool


class VariableResponse(BaseModel):
    """Schema for variable response."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    key: str
    value: Optional[str] = None
    scope: str


class VariableSubstituteResponse(BaseModel):
    """Schema for substitution response."""
    model_config = ConfigDict(from_attributes=True)

    original: str
    substituted: str
    variable: str


class PaginatedVariableList(BaseModel):
    """Paginated list of variables."""
    model_config = ConfigDict(from_attributes=True)

    items: list[VariableListItem]
    total: int
    page: int
    page_size: int
    pages: int
