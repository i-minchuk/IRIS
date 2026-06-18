"""1C integration module — export documents to 1C:Enterprise format."""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.modules.auth.deps import get_current_active_user
from app.modules.auth.models import User
from app.modules.documents.models import Document
from app.modules.projects.models import Project
from app.modules.tenders.models import Tender

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/1c", tags=["1C Integration"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class OneCDocumentExport(BaseModel):
    document_id: int = Field(..., gt=0)
    include_content: bool = Field(default=False)


class OneCContractExport(BaseModel):
    tender_id: int = Field(..., gt=0)


class OneCExportResult(BaseModel):
    export_id: str
    format: str = "EnterpriseData"
    version: str = "1.0"
    items_count: int
    xml_content: Optional[str] = None
    json_content: Optional[Dict[str, Any]] = None
    generated_at: str


class OneCNomenclatureItem(BaseModel):
    id: str
    name: str
    code: str
    doc_type: str
    status: str
    project_name: Optional[str] = None
    author: Optional[str] = None
    created_at: Optional[str] = None


class OneCContractItem(BaseModel):
    id: str
    number: str
    name: str
    customer: Optional[str] = None
    amount: Optional[float] = None
    currency: str = "RUB"
    status: str
    created_at: Optional[str] = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _generate_enterprise_data_xml(items: List[Dict[str, Any]], data_type: str) -> str:
    """Generate simplified 1C EnterpriseData XML."""
    xml_parts = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<EnterpriseData xmlns="http://v8.1c.ru/edi/edi_stnd">',
        f'  <DataType>{data_type}</DataType>',
        '  <Items>',
    ]
    for item in items:
        xml_parts.append('    <Item>')
        for key, value in item.items():
            xml_parts.append(f'      <{key}>{value}</{key}>')
        xml_parts.append('    </Item>')
    xml_parts.extend([
        '  </Items>',
        '</EnterpriseData>',
    ])
    return '\n'.join(xml_parts)


def _generate_json_export(items: List[Dict[str, Any]], data_type: str) -> Dict[str, Any]:
    """Generate JSON export format."""
    return {
        "format": "DokPotok_1C_Export",
        "version": "1.0",
        "data_type": data_type,
        "generated_at": datetime.now().isoformat(),
        "items": items,
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/export-documents", response_model=OneCExportResult)
async def export_documents_to_1c(
    request: OneCDocumentExport,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Export documents to 1C EnterpriseData format."""
    # Get document
    result = await db.execute(select(Document).where(Document.id == request.document_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Get project info
    project_name = None
    if doc.project_id:
        proj_result = await db.execute(select(Project).where(Project.id == doc.project_id))
        project = proj_result.scalar_one_or_none()
        if project:
            project_name = project.name

    # Build nomenclature item
    item = {
        "id": str(doc.id),
        "name": doc.name or "",
        "code": doc.number or "",
        "doc_type": doc.doc_type or "",
        "status": doc.status or "",
        "project_name": project_name or "",
        "author": str(doc.author_id) if doc.author_id else None,
        "created_at": doc.created_at.isoformat() if doc.created_at else None,
    }

    if request.include_content and doc.content:
        item["content_preview"] = str(doc.content)[:500]

    xml = _generate_enterprise_data_xml([item], "CatalogObject.Номенклатура")
    json_data = _generate_json_export([item], "nomenclature")

    return OneCExportResult(
        export_id=f"exp_{doc.id}_{int(datetime.now().timestamp())}",
        items_count=1,
        xml_content=xml,
        json_content=json_data,
        generated_at=datetime.now().isoformat(),
    )


@router.post("/export-batch", response_model=OneCExportResult)
async def export_batch_documents(
    document_ids: List[int],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Batch export multiple documents to 1C."""
    items = []
    for doc_id in document_ids:
        result = await db.execute(select(Document).where(Document.id == doc_id))
        doc = result.scalar_one_or_none()
        if not doc:
            continue

        project_name = None
        if doc.project_id:
            proj_result = await db.execute(select(Project).where(Project.id == doc.project_id))
            project = proj_result.scalar_one_or_none()
            if project:
                project_name = project.name

        items.append({
            "id": str(doc.id),
            "name": doc.name or "",
            "code": doc.number or "",
            "doc_type": doc.doc_type or "",
            "status": doc.status or "",
            "project_name": project_name or "",
            "author": str(doc.author_id) if doc.author_id else None,
            "created_at": doc.created_at.isoformat() if doc.created_at else None,
        })

    xml = _generate_enterprise_data_xml(items, "CatalogObject.Номенклатура")
    json_data = _generate_json_export(items, "nomenclature")

    return OneCExportResult(
        export_id=f"batch_{int(datetime.now().timestamp())}",
        items_count=len(items),
        xml_content=xml,
        json_content=json_data,
        generated_at=datetime.now().isoformat(),
    )


@router.post("/import-contracts", response_model=OneCExportResult)
async def import_contracts_from_1c(
    request: OneCContractExport,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Import contract data from 1C (tender → contract mapping)."""
    result = await db.execute(select(Tender).where(Tender.id == request.tender_id))
    tender = result.scalar_one_or_none()
    if not tender:
        raise HTTPException(status_code=404, detail="Tender not found")

    item = {
        "id": str(tender.id),
        "number": tender.number or "",
        "name": tender.name or "",
        "customer": tender.customer or "",
        "amount": float(tender.amount) if tender.amount else None,
        "currency": "RUB",
        "status": tender.status or "",
        "created_at": tender.created_at.isoformat() if tender.created_at else None,
    }

    xml = _generate_enterprise_data_xml([item], "DocumentObject.ЗаказПокупателя")
    json_data = _generate_json_export([item], "contract")

    return OneCExportResult(
        export_id=f"contract_{tender.id}_{int(datetime.now().timestamp())}",
        items_count=1,
        xml_content=xml,
        json_content=json_data,
        generated_at=datetime.now().isoformat(),
    )


@router.get("/export-formats", response_model=List[str])
async def get_export_formats():
    """Get available 1C export formats."""
    return ["EnterpriseData", "JSON", "CSV"]
