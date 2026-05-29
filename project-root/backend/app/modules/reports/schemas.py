"""Pydantic schemas for Reports API."""
from __future__ import annotations

from datetime import date, datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict


class ReportTemplate(str, Enum):
    """Available report templates."""

    PROJECTS = "projects"
    TENDERS = "tenders"
    LOAD = "load"
    FINANCES = "finances"


class ReportRequest(BaseModel):
    """Request body for report generation."""

    model_config = ConfigDict(from_attributes=True)

    template: ReportTemplate
    from_date: date | None = None
    to_date: date | None = None
    project_id: int | None = None
    user_id: int | None = None


class ReportRow(BaseModel):
    """Universal report row."""

    model_config = ConfigDict(from_attributes=True)

    columns: dict[str, str | int | float | None]


class ReportResponse(BaseModel):
    """Generated report response."""

    model_config = ConfigDict(from_attributes=True)

    template: str
    columns: list[str]
    rows: list[ReportRow]
    generated_at: datetime
