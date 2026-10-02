"""Celery-задачи документов: генерация титульного листа и обработка файлов.

generate_pdf — реально строит PDF титульного листа (app.modules.documents.title_sheet)
и складывает его в storage/generated (отдаётся GET /documents/generated/{name}).
process_file — операции:
  * extract_text: парсинг файла (app.parser) и возврат текста/превью;
  * index: парсинг + векторный индекс Qdrant (app.parser.indexer);
  * иначе — честный status=failed.
"""
from __future__ import annotations

import asyncio
import io
from pathlib import Path

from app.tasks.celery_app import celery_app

_TITLE_SHEET_TEMPLATES = {"title_sheet", "title-sheet", "титульный_лист"}


@celery_app.task(bind=True, max_retries=3)
def generate_pdf(self, document_id: int, template_name: str = "title_sheet",
                 params: dict | None = None):
    """Генерация PDF-документа по шаблону (титульный лист)."""
    if template_name not in _TITLE_SHEET_TEMPLATES:
        return {
            "status": "failed",
            "document_id": document_id,
            "reason": f"unknown template '{template_name}'",
        }
    try:
        from app.core.config import settings
        from app.db.session import AsyncSessionLocal
        from app.modules.documents.title_sheet import (
            build_title_sheet_bytes,
            collect_title_sheet_fields,
        )

        async def _build() -> tuple[str, int]:
            async with AsyncSessionLocal() as db:
                fields = await collect_title_sheet_fields(db, document_id)
                pdf = build_title_sheet_bytes(fields)
                out_dir = Path(settings.IRIS_STORAGE_ROOT) / "generated"
                out_dir.mkdir(parents=True, exist_ok=True)
                safe = "".join(
                    c if c.isalnum() or c in "-_" else "_"
                    for c in fields["number"]
                ) or str(document_id)
                stored_name = f"title_sheet_{document_id}_{safe}.pdf"
                (out_dir / stored_name).write_bytes(pdf)
                return stored_name, len(pdf)

        stored_name, size = asyncio.run(_build())
        return {
            "status": "completed",
            "document_id": document_id,
            "file_name": stored_name,
            "size_bytes": size,
            "url": f"/api/v1/documents/generated/{stored_name}",
        }
    except ValueError as exc:
        # Документ не найден — ретрай бессмысленен
        return {"status": "failed", "document_id": document_id, "reason": str(exc)}
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(bind=True, max_retries=3)
def process_file(self, file_path: str, operation: str, options: dict | None = None):
    """Обработка загруженного файла: extract_text (парсинг) или index (Qdrant)."""
    options = options or {}
    path = Path(file_path)
    if not path.is_file():
        return {
            "status": "failed",
            "file_path": file_path,
            "operation": operation,
            "reason": "file not found",
        }

    if operation == "extract_text":
        try:
            from app.parser.factory import ParserFactory

            with open(path, "rb") as fh:
                parsed = ParserFactory.parse(io.BytesIO(fh.read()), path.name)
            return {
                "status": "completed",
                "file_path": file_path,
                "operation": operation,
                "file_name": parsed.file_name,
                "file_type": parsed.file_type,
                "chars": len(parsed.content),
                "sections": len(parsed.sections),
                "entities": len(parsed.entities),
                "preview": parsed.content[:500],
            }
        except ValueError as exc:
            # Нет парсера для формата — ретрай бессмысленен
            return {
                "status": "failed",
                "file_path": file_path,
                "operation": operation,
                "reason": str(exc),
            }
        except Exception as exc:
            raise self.retry(exc=exc, countdown=60)

    if operation == "index":
        try:
            from uuid import uuid4

            from app.parser.factory import ParserFactory
            from app.parser.indexer import DocumentIndexer

            with open(path, "rb") as fh:
                parsed = ParserFactory.parse(io.BytesIO(fh.read()), path.name)
            parsed.document_id = uuid4()
            indexer = DocumentIndexer()
            chunk_ids = asyncio.run(indexer.index(parsed, original_doc_id=parsed.document_id))
            return {
                "status": "completed",
                "file_path": file_path,
                "operation": operation,
                "file_name": parsed.file_name,
                "chunks": len(chunk_ids),
                "collection": indexer.collection,
            }
        except ValueError as exc:
            return {
                "status": "failed",
                "file_path": file_path,
                "operation": operation,
                "reason": str(exc),
            }
        except Exception as exc:
            # Qdrant/эмбеддер недоступны — честно пропускаем, без ретраев
            return {
                "status": "skipped",
                "file_path": file_path,
                "operation": operation,
                "reason": str(exc)[:300],
            }

    return {
        "status": "failed",
        "file_path": file_path,
        "operation": operation,
        "reason": f"unknown operation '{operation}'",
    }
