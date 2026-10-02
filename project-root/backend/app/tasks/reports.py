"""Celery-задачи генерации отчётов и экспорта данных.

Реальная генерация: отчёты рендерятся в xlsx/pdf и складываются в
IRIS_STORAGE_ROOT/reports (отдача — через GET /api/v1/reports/files/{name}).
Экспорт данных — в IRIS_STORAGE_ROOT/exports.
Локально (без Redis/worker) те же функции можно вызвать напрямую.
"""
from __future__ import annotations

import asyncio
import csv
import io
import json
import logging
import os
import uuid
from datetime import date, datetime

from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.modules.reports.exporters import report_to_pdf_bytes, report_to_xlsx_bytes
from app.modules.reports.router import build_report_response
from app.modules.reports.schemas import ReportRequest, ReportTemplate
from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)

# Модели, доступные для export_data (безопасный whitelist)
_EXPORTABLE_MODELS = {
    "projects": "app.modules.projects.models.Project",
    "tenders": "app.modules.tenders.models.Tender",
    "tasks": "app.modules.tasks.models.Task",
    "documents": "app.modules.documents.models.Document",
    "remarks": "app.modules.remarks.models.Remark",
    "users": "app.modules.auth.models.User",
}


def _storage_dir(subdir: str) -> str:
    path = os.path.join(settings.IRIS_STORAGE_ROOT, subdir)
    os.makedirs(path, exist_ok=True)
    return path


def _save_file(subdir: str, data: bytes, ext: str) -> str:
    stored_name = f"{uuid.uuid4().hex}.{ext}"
    with open(os.path.join(_storage_dir(subdir), stored_name), "wb") as f:
        f.write(data)
    return stored_name


async def _build_report(report_type: str, params: dict) -> "object":
    template = ReportTemplate(report_type)
    from_date = date.fromisoformat(params["from_date"]) if params.get("from_date") else None
    to_date = date.fromisoformat(params["to_date"]) if params.get("to_date") else None
    request = ReportRequest(
        template=template,
        from_date=from_date,
        to_date=to_date,
        project_id=params.get("project_id"),
        user_id=params.get("user_id"),
    )
    async with AsyncSessionLocal() as db:
        return await build_report_response(request, db)


@celery_app.task(bind=True, max_retries=3)
def generate_report(self, report_type: str, params: dict):
    """Генерация отчёта указанного типа в файл (xlsx по умолчанию, pdf опционально)."""
    params = params or {}
    fmt = params.get("format", "xlsx")
    if fmt not in ("xlsx", "pdf"):
        return {
            "status": "failed",
            "report_type": report_type,
            "error": f"Неподдерживаемый формат: {fmt} (допустимы xlsx, pdf)",
        }
    try:
        report = asyncio.run(_build_report(report_type, params))
    except ValueError as exc:
        return {"status": "failed", "report_type": report_type, "error": str(exc)}
    except Exception as exc:
        logger.exception("Report generation failed: %s", exc)
        raise self.retry(exc=exc, countdown=60)

    data = report_to_pdf_bytes(report) if fmt == "pdf" else report_to_xlsx_bytes(report)
    stored_name = _save_file("reports", data, fmt)
    return {
        "status": "completed",
        "report_type": report_type,
        "format": fmt,
        "rows": len(report.rows),
        "url": f"/api/v1/reports/files/{stored_name}",
    }


@celery_app.task(bind=True, max_retries=3)
def export_data(self, model_name: str, format_type: str, filters: dict | None = None):
    """Экспорт данных модели в csv, xlsx или json (whitelist моделей)."""
    filters = filters or {}
    if model_name not in _EXPORTABLE_MODELS:
        return {
            "status": "failed",
            "model": model_name,
            "error": f"Неизвестная модель. Доступны: {sorted(_EXPORTABLE_MODELS)}",
        }
    if format_type not in ("csv", "xlsx", "json"):
        return {
            "status": "failed",
            "model": model_name,
            "error": f"Неподдерживаемый формат: {format_type} (допустимы csv, xlsx, json)",
        }

    module_path, class_name = _EXPORTABLE_MODELS[model_name].rsplit(".", 1)
    module = __import__(module_path, fromlist=[class_name])
    model = getattr(module, class_name)

    async def _fetch() -> list[dict]:
        from sqlalchemy import select

        async with AsyncSessionLocal() as db:
            query = select(model)
            project_id = filters.get("project_id")
            if project_id is not None and hasattr(model, "project_id"):
                query = query.where(model.project_id == project_id)
            result = await db.execute(query)
            rows = result.scalars().all()
            columns = [c.name for c in model.__table__.columns]
            out = []
            for row in rows:
                item = {}
                for col in columns:
                    value = getattr(row, col)
                    if isinstance(value, (datetime, date)):
                        value = value.isoformat()
                    item[col] = value
                out.append(item)
            return out

    try:
        rows = asyncio.run(_fetch())
    except Exception as exc:
        logger.exception("Export failed: %s", exc)
        raise self.retry(exc=exc, countdown=60)

    if format_type == "json":
        data = json.dumps(rows, ensure_ascii=False, default=str).encode("utf-8")
    elif format_type == "csv":
        buffer = io.StringIO()
        if rows:
            writer = csv.DictWriter(buffer, fieldnames=list(rows[0].keys()))
            writer.writeheader()
            writer.writerows(rows)
        data = buffer.getvalue().encode("utf-8-sig")
    else:  # xlsx
        from openpyxl import Workbook

        wb = Workbook()
        ws = wb.active
        ws.title = model_name[:31]
        if rows:
            ws.append(list(rows[0].keys()))
            for row in rows:
                ws.append([row[k] for k in rows[0].keys()])
        buffer = io.BytesIO()
        wb.save(buffer)
        data = buffer.getvalue()

    stored_name = _save_file("exports", data, format_type)
    return {
        "status": "completed",
        "model": model_name,
        "format": format_type,
        "rows": len(rows),
        "url": f"/api/v1/reports/files/{stored_name}",
    }
