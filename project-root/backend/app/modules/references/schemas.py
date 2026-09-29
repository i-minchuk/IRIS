"""Схемы справочников."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class GlossaryTermBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    term: str
    definition: str
    company_usage: Optional[str] = None
    where_found: Optional[str] = None
    department: Optional[str] = None
    source: str = "ai"


class GlossaryTermCreate(GlossaryTermBase):
    document_id: Optional[int] = None
    project_id: Optional[int] = None


class GlossaryTermRead(GlossaryTermBase):
    id: int
    document_id: Optional[int] = None
    project_id: Optional[int] = None
    created_by_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class GlossaryGenerateRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    project_id: Optional[int] = None
    limit_documents: Optional[int] = 50


class GlossaryGenerateResult(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    term: str
    definition: str
    company_usage: Optional[str] = None
    where_found: Optional[str] = None
    department: Optional[str] = None


class GlossaryGenerateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    generated: int
    terms: list[GlossaryTermRead]


class StandardRequirement(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    type: str = "other"
    value: str
    description: Optional[str] = None
    section: Optional[str] = None


class StandardRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    requirements: list[StandardRequirement]
    source: str = "upload"
    created_by_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class StandardCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    requirements: list[StandardRequirement] = []
    source: str = "manual"
