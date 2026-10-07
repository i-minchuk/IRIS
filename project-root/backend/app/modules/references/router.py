"""API справочников."""
from __future__ import annotations

import json
import os
import shutil
import uuid
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
from typing import Any, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.ai_key import get_ai_client, get_openai_api_key, supports_json_response_format
from app.core.config import settings
from app.db.session import get_db
from app.modules.auth.deps import get_current_active_user
from app.modules.auth.models import User
from app.modules.documents.models import Document
from app.modules.projects.models import Project
from app.modules.references.models import GlossaryTerm, Standard
from app.modules.references.schemas import (
    GlossaryGenerateRequest,
    GlossaryGenerateResponse,
    GlossaryGenerateResult,
    GlossaryTermCreate,
    GlossaryTermRead,
    StandardCreate,
    StandardRead,
)
from app.core.permissions import require_permission
from app.parser.factory import ParserFactory

router = APIRouter(tags=["references"])

_references_write = require_permission("references.write")


GLOSSARY_SYSTEM_PROMPT = """Ты — эксперт по технической документации в системе ДокПоток IRIS.
Проанализируй предоставленные фрагменты документов и извлеки технические термины, аббревиатуры и специфические понятия.

Для каждого термина подготовь объект со следующими полями:
- term: термин или аббревиатура (кратко)
- definition: определение термина
- companyUsage: пример использования в проектной документации (1-2 предложения)
- whereFound: источник, где встретился термин (название документа)
- department: предполагаемый отдел/дисциплина, к которой относится термин (например, «Процесс», «Механика», «Электрика», «Сметы», «ПТО»)

Ответь строго в формате JSON-массива. Не добавляй пояснений вне JSON."""


def _extract_text_from_content(content: Any) -> str:
    """Извлекает плоский текст из поля content документа."""
    if content is None:
        return ""
    if isinstance(content, str):
        return content
    if isinstance(content, dict):
        parts = []
        for value in content.values():
            if isinstance(value, str):
                parts.append(value)
            elif isinstance(value, list):
                for item in value:
                    if isinstance(item, str):
                        parts.append(item)
                    elif isinstance(item, dict):
                        parts.extend(
                            str(v) for v in item.values() if isinstance(v, (str, int, float))
                        )
            elif isinstance(value, dict):
                parts.extend(
                    str(v) for v in value.values() if isinstance(v, (str, int, float))
                )
        return "\n".join(parts)
    return str(content)


def _build_document_text(doc: Document) -> str:
    """Формирует текстовое описание документа для передачи в LLM."""
    parts = [
        f"Документ: {doc.name or '—'}",
        f"Код: {doc.number or '—'}",
        f"Тип: {doc.doc_type or '—'}",
    ]
    text = _extract_text_from_content(doc.content)
    if text:
        parts.append(f"Содержание:\n{text[:2000]}")
    return "\n".join(parts)


async def _call_llm_for_glossary(text: str, db: AsyncSession) -> list[dict[str, Any]]:
    """Запрашивает у LLM список терминов для переданного текста."""
    api_key = await get_openai_api_key(db)
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OPENAI_API_KEY не настроен: автоматическая генерация глоссария недоступна",
        )

    client = await get_ai_client(db)

    messages = [
        {"role": "system", "content": GLOSSARY_SYSTEM_PROMPT},
        {"role": "user", "content": f"Извлеки термины из следующих документов:\n\n{text[:12000]}"},
    ]

    try:
        request_kwargs = {
            "model": settings.LLM_MODEL,
            "messages": messages,
            "temperature": 0.2,
            "max_tokens": 3000,
        }
        if supports_json_response_format():
            request_kwargs["response_format"] = {"type": "json_object"}
        response = await client.chat.completions.create(**request_kwargs)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Ошибка при обращении к LLM: {exc}",
        ) from exc

    content = response.choices[0].message.content or "{}"
    try:
        parsed = json.loads(content)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Некорректный ответ LLM: {exc}",
        ) from exc

    # LLM может вернуть либо массив, либо объект с ключом terms
    if isinstance(parsed, list):
        return parsed
    if isinstance(parsed, dict):
        return parsed.get("terms", []) or parsed.get("glossary", []) or []
    return []


@router.get("/glossary", response_model=list[GlossaryTermRead])
async def list_glossary_terms(
    project_id: Optional[int] = None,
    department: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Список терминов глоссария с фильтрами."""
    query = select(GlossaryTerm)
    if project_id is not None:
        query = query.where(GlossaryTerm.project_id == project_id)
    if department:
        query = query.where(GlossaryTerm.department.ilike(f"%{department}%"))
    if search:
        query = query.where(
            (GlossaryTerm.term.ilike(f"%{search}%"))
            | (GlossaryTerm.definition.ilike(f"%{search}%"))
        )
    result = await db.execute(query.order_by(GlossaryTerm.term))
    return list(result.scalars().all())


@router.post("/glossary", response_model=GlossaryTermRead, status_code=status.HTTP_201_CREATED)
async def create_glossary_term(
    data: GlossaryTermCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_references_write),
):
    """Ручное добавление термина в глоссарий."""
    term = GlossaryTerm(
        term=data.term,
        definition=data.definition,
        company_usage=data.company_usage,
        where_found=data.where_found,
        department=data.department,
        source=data.source,
        document_id=data.document_id,
        project_id=data.project_id,
        created_by_id=current_user.id,
    )
    db.add(term)
    await db.commit()
    await db.refresh(term)
    return term


@router.post("/glossary/generate", response_model=GlossaryGenerateResponse)
async def generate_glossary(
    request: GlossaryGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_references_write),
):
    """Автоматическая генерация глоссария из документации с помощью AI."""
    query = select(Document)
    if request.project_id is not None:
        query = query.where(Document.project_id == request.project_id)
    if request.limit_documents:
        query = query.limit(request.limit_documents)

    result = await db.execute(query.order_by(Document.created_at.desc()))
    docs = list(result.scalars().all())

    if not docs:
        return GlossaryGenerateResponse(generated=0, terms=[])

    context_parts = []
    for doc in docs:
        context_parts.append(_build_document_text(doc))
    context_text = "\n\n---\n\n".join(context_parts)

    raw_terms = await _call_llm_for_glossary(context_text, db)

    generated_terms: list[GlossaryTerm] = []
    for item in raw_terms:
        term_text = str(item.get("term") or "").strip()
        definition = str(item.get("definition") or "").strip()
        if not term_text or not definition:
            continue

        # Проверяем, что термин ещё не существует
        existing = await db.execute(
            select(GlossaryTerm).where(GlossaryTerm.term.ilike(term_text))
        )
        if existing.scalar_one_or_none():
            continue

        term = GlossaryTerm(
            term=term_text,
            definition=definition,
            company_usage=str(item.get("companyUsage") or "").strip() or None,
            where_found=str(item.get("whereFound") or "").strip() or None,
            department=str(item.get("department") or "").strip() or None,
            source="ai",
            project_id=request.project_id,
            created_by_id=current_user.id,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(term)
        generated_terms.append(term)

    await db.commit()
    for term in generated_terms:
        await db.refresh(term)

    return GlossaryGenerateResponse(
        generated=len(generated_terms),
        terms=[GlossaryTermRead.model_validate(t) for t in generated_terms],
    )


@router.delete("/glossary/{term_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_glossary_term(
    term_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_references_write),
):
    """Удаление термина из глоссария."""
    term = await db.get(GlossaryTerm, term_id)
    if not term:
        raise HTTPException(status_code=404, detail="Термин не найден")
    await db.delete(term)
    await db.commit()
    return None


# ---------------------------------------------------------------------------
# Standards / Normatives
# ---------------------------------------------------------------------------

STANDARDS_PROMPT = """Ты — эксперт по нормативно-технической документации.
Проанализируй предоставленный текст нормативного документа (ГОСТ, СНиП, СП, ТУ, стандарт) и извлеки основные технические требования.

Для каждого требования подготовь объект со следующими полями:
- type: тип требования — одно из значений: gost, material, dimension, pressure, temperature, other
- value: краткая суть требования (1-2 предложения)
- description: развёрнутое пояснение или конкретные значения/параметры
- section: раздел/пункт документа, откуда взято требование (если указан)

Ответь строго в формате JSON-массива. Не добавляй пояснений вне JSON."""


async def _extract_standards_requirements(text: str, db: AsyncSession) -> list[dict[str, Any]]:
    """Извлекает требования из текста норматива с помощью LLM."""
    api_key = await get_openai_api_key(db)
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OPENAI_API_KEY не настроен: автоматическое извлечение требований недоступно",
        )

    client = await get_ai_client(db)

    request_kwargs = {
        "model": settings.LLM_MODEL,
        "messages": [
            {"role": "system", "content": STANDARDS_PROMPT},
            {"role": "user", "content": text[:20000]},
        ],
        "temperature": 0.2,
        "max_tokens": 3000,
    }
    if supports_json_response_format():
        request_kwargs["response_format"] = {"type": "json_object"}
    response = await client.chat.completions.create(**request_kwargs)

    content = response.choices[0].message.content or "{}"
    parsed = json.loads(content)
    if isinstance(parsed, list):
        return parsed
    if isinstance(parsed, dict):
        return parsed.get("requirements", []) or parsed.get("items", []) or []
    return []


async def _generate_glossary_for_standard(
    text: str,
    standard: Standard,
    db: AsyncSession,
    current_user: User,
) -> list[GlossaryTerm]:
    """Генерирует термины глоссария из текста загруженного норматива."""
    context = f"Норматив: {standard.name}\nКод: {standard.code or '—'}\n\n{text[:12000]}"
    raw_terms = await _call_llm_for_glossary(context, db)

    generated_terms: list[GlossaryTerm] = []
    for item in raw_terms:
        term_text = str(item.get("term") or "").strip()
        definition = str(item.get("definition") or "").strip()
        if not term_text or not definition:
            continue

        existing = await db.execute(
            select(GlossaryTerm).where(GlossaryTerm.term.ilike(term_text))
        )
        if existing.scalar_one_or_none():
            continue

        source_name = f"{standard.name} ({standard.code})" if standard.code else standard.name
        term = GlossaryTerm(
            term=term_text,
            definition=definition,
            company_usage=str(item.get("companyUsage") or "").strip() or None,
            where_found=source_name,
            department=str(item.get("department") or "").strip() or None,
            source="ai",
            created_by_id=current_user.id,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(term)
        generated_terms.append(term)

    if generated_terms:
        await db.commit()
        for term in generated_terms:
            await db.refresh(term)

    return generated_terms


def _save_standard_file(file: UploadFile) -> tuple[str, str]:
    """Сохраняет файл норматива на диск и возвращает (file_path, file_name)."""
    storage_root = Path(settings.IRIS_STORAGE_ROOT)
    standards_dir = storage_root / "standards"
    standards_dir.mkdir(parents=True, exist_ok=True)

    original_name = file.filename or "unknown"
    ext = original_name.split(".")[-1] if "." in original_name else ""
    unique_name = f"{uuid.uuid4().hex}.{ext}" if ext else uuid.uuid4().hex
    file_path = standards_dir / unique_name

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return str(file_path), original_name


@router.get("/standards", response_model=list[StandardRead])
async def list_standards(
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Список нормативных документов."""
    query = select(Standard)
    if search:
        query = query.where(
            (Standard.name.ilike(f"%{search}%"))
            | (Standard.code.ilike(f"%{search}%"))
        )
    result = await db.execute(query.order_by(Standard.name))
    return list(result.scalars().all())


@router.post("/standards", response_model=StandardRead, status_code=status.HTTP_201_CREATED)
async def create_standard(
    data: StandardCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_references_write),
):
    """Ручное создание норматива с требованиями."""
    standard = Standard(
        name=data.name,
        code=data.code,
        description=data.description,
        requirements=[r.model_dump() for r in data.requirements],
        source=data.source,
        created_by_id=current_user.id,
    )
    db.add(standard)
    await db.commit()
    await db.refresh(standard)
    return standard


@router.post("/standards/upload", response_model=StandardRead)
async def upload_standard(
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    code: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    extract_ai: bool = Form(True),
    generate_glossary: bool = Form(True),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_references_write),
):
    """Загрузить файл норматива и автоматически извлечь требования и термины глоссария с помощью AI."""
    allowed_exts = {".docx", ".pdf"}
    file_name = file.filename or ""
    ext = f".{file_name.lower().split('.')[-1]}" if "." in file_name else ""
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=400,
            detail="Поддерживаются только файлы .docx и .pdf",
        )

    contents = await file.read()
    file_size = len(contents)

    try:
        parsed = ParserFactory.parse(BytesIO(contents), file_name)
        text = parsed.content or ""
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"Ошибка парсинга файла: {exc}"
        ) from exc

    requirements: list[dict[str, Any]] = []
    if extract_ai:
        if not text.strip():
            raise HTTPException(
                status_code=400, detail="Не удалось извлечь текст из файла"
            )
        requirements = await _extract_standards_requirements(text, db)

    standard_name = name or file_name
    standard_code = code or file_name

    await file.seek(0)
    file_path, _ = _save_standard_file(file)

    standard = Standard(
        name=standard_name,
        code=standard_code,
        description=description,
        file_path=file_path,
        file_name=file_name,
        file_size=file_size,
        requirements=requirements,
        source="upload",
        created_by_id=current_user.id,
    )
    db.add(standard)
    await db.commit()
    await db.refresh(standard)

    if generate_glossary and text.strip():
        try:
            await _generate_glossary_for_standard(text, standard, db, current_user)
        except Exception:
            # Генерация глоссария — дополнительная функция, не должна ломать загрузку норматива.
            await db.rollback()

    return standard


@router.delete("/standards/{standard_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_standard(
    standard_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(_references_write),
):
    """Удаление норматива."""
    standard = await db.get(Standard, standard_id)
    if not standard:
        raise HTTPException(status_code=404, detail="Норматив не найден")
    if standard.file_path and os.path.exists(standard.file_path):
        try:
            os.remove(standard.file_path)
        except OSError:
            pass
    await db.delete(standard)
    await db.commit()
    return None


@router.get("/standards/by-document/{document_id}", response_model=list[dict[str, Any]])
async def get_standards_by_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Требования из нормативов, привязанных к документу."""
    doc = await db.get(Document, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Документ не найден")

    standard_ids = doc.standard_ids or []
    if not standard_ids:
        return []

    result = await db.execute(select(Standard).where(Standard.id.in_(standard_ids)))
    standards = result.scalars().all()

    requirements: list[dict[str, Any]] = []
    for standard in standards:
        for req in standard.requirements or []:
            if isinstance(req, dict):
                requirements.append({
                    "type": req.get("type", "other"),
                    "value": req.get("value", ""),
                    "description": req.get("description"),
                    "section": req.get("section"),
                    "standard_name": standard.name,
                    "standard_code": standard.code,
                })
    return requirements
