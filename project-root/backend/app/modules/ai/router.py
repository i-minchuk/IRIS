"""AI router — v0.3.0 endpoints: semantic search, document analysis, RAG chat, requirements extraction."""
from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from io import BytesIO
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.auth.deps import get_current_active_user
from app.modules.auth.models import User
from app.ai.service import AIService
from app.ai.classification import classify_document
from app.ai.autofill import suggest_document_fields
from app.parser.factory import ParserFactory
from app.parser.indexer import DocumentIndexer
from app.core.ai_key import get_ai_client, get_openai_api_key, is_openai_configured, supports_json_response_format
from app.core.config import settings
from app.core.mode import require_integrations

logger = logging.getLogger(__name__)
router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class SemanticSearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000)
    top_k: int = Field(10, ge=1, le=50)
    document_id: Optional[str] = None


class SemanticSearchResult(BaseModel):
    chunk_id: str
    score: float
    text: str
    section: Optional[str] = None
    heading: Optional[str] = None
    page: Optional[int] = None
    document_id: str
    file_name: str


class SemanticSearchResponse(BaseModel):
    results: List[SemanticSearchResult]
    total: int
    query: str


class DocumentAnalysisResponse(BaseModel):
    document_id: str
    overall_score: float
    findings: List[Dict[str, Any]]
    critical_count: int
    warning_count: int
    info_count: int


class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=10000)
    session_id: Optional[str] = None
    document_id: Optional[str] = None
    project_id: Optional[str] = None
    stream: bool = False


class ChatResponse(BaseModel):
    response_id: str
    content: str
    confidence: float
    sources: List[Dict[str, Any]] = []
    requires_human_review: bool = False


class ExtractRequirementsResponse(BaseModel):
    document_id: str
    requirements: List[Dict[str, Any]]
    extracted_at: str


class ComplianceCheckRequest(BaseModel):
    document_id: str
    requirements: str


class ComplianceCheckResponse(BaseModel):
    document_id: str
    compliant: bool
    findings: List[Dict[str, Any]]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _ai_disabled_response() -> Dict[str, Any]:
    return {"detail": "AI недоступен: OPENAI_API_KEY не настроен"}


# ---------------------------------------------------------------------------
# 3.3 Semantic Search
# ---------------------------------------------------------------------------

@router.post("/search", response_model=SemanticSearchResponse)
async def semantic_search(
    request: SemanticSearchRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    _: None = Depends(require_integrations),
):
    """Семантический поиск по документам через Qdrant + embeddings."""
    if not await is_openai_configured(db):
        raise HTTPException(status_code=503, detail="AI недоступен: OPENAI_API_KEY не настроен")

    try:
        indexer = DocumentIndexer()
        doc_id = UUID(request.document_id) if request.document_id else None

        results = await indexer.search(
            query=request.query,
            top_k=request.top_k,
            document_id=doc_id,
        )

        return SemanticSearchResponse(
            results=[
                SemanticSearchResult(
                    chunk_id=r["chunk_id"],
                    score=r["score"],
                    text=r["text"],
                    section=r.get("section"),
                    heading=r.get("heading"),
                    page=r.get("page"),
                    document_id=r["document_id"],
                    file_name=r["file_name"],
                )
                for r in results
            ],
            total=len(results),
            query=request.query,
        )
    except Exception as exc:
        logger.warning("Semantic search failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Ошибка поиска: {exc}")


# ---------------------------------------------------------------------------
# 3.1 Document Analysis
# ---------------------------------------------------------------------------

@router.post("/analyze/{document_id}", response_model=DocumentAnalysisResponse)
async def analyze_document_endpoint(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    _: None = Depends(require_integrations),
):
    """AI-анализ документа на ошибки, структуру, ГОСТ."""
    if not await is_openai_configured(db):
        raise HTTPException(status_code=503, detail="AI недоступен: OPENAI_API_KEY не настроен")

    try:
        numeric_id = int(document_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid document_id")

    try:
        from sqlalchemy import select
        from app.modules.documents.models import Document

        db_result = await db.execute(select(Document).where(Document.id == numeric_id))
        doc = db_result.scalar_one_or_none()
        if not doc:
            raise HTTPException(status_code=404, detail="Документ не найден")

        # Извлекаем текст для анализа из content.body, названия или номера документа
        document_text = ""
        if isinstance(doc.content, dict):
            body = doc.content.get("body")
            if isinstance(body, str):
                document_text = body
        if not document_text:
            document_text = f"{doc.number} {doc.name}".strip()

        ai = AIService(db)
        result = await ai.analyze_document(document_id, document_text=document_text)

        # Сохраняем результат в document.content
        if doc.content is None or not isinstance(doc.content, dict):
            doc.content = {}
        doc.content["ai_analysis"] = {
            "overall_score": result.overall_score,
            "findings": result.findings,
            "critical_count": result.critical_count,
            "warning_count": result.warning_count,
            "info_count": result.info_count,
            "analyzed_at": str(datetime.now(timezone.utc)),
        }
        await db.commit()

        return DocumentAnalysisResponse(
            document_id=document_id,
            overall_score=result.overall_score,
            findings=result.findings,
            critical_count=result.critical_count,
            warning_count=result.warning_count,
            info_count=result.info_count,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("Document analysis failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Ошибка анализа: {exc}")


# ---------------------------------------------------------------------------
# 3.4 RAG Chat
# ---------------------------------------------------------------------------

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    _: None = Depends(require_integrations),
):
    """RAG-чат с AI — ответы на основе документов из Qdrant."""
    if not await is_openai_configured(db):
        raise HTTPException(status_code=503, detail="AI недоступен: OPENAI_API_KEY не настроен")

    try:
        ai = AIService(db)
        from app.ai.models import ChatRequest as AIChatRequest

        doc_id = UUID(request.document_id) if request.document_id else None
        session_uuid = UUID(request.session_id) if request.session_id else UUID("00000000-0000-0000-0000-000000000000")

        chat_req = AIChatRequest(
            message=request.message,
            session_id=session_uuid,
            document_id=doc_id,
            project_id=None,
            stream=request.stream,
        )
        result = await ai.chat(chat_req)

        return ChatResponse(
            response_id=str(result.response_id),
            content=result.content,
            confidence=result.confidence,
            sources=result.sources,
            requires_human_review=result.requires_human_review,
        )
    except Exception as exc:
        logger.warning("Chat failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Ошибка чата: {exc}")


# ---------------------------------------------------------------------------
# 3.2 Extract Requirements
# ---------------------------------------------------------------------------

@router.post("/extract-requirements/{document_id}", response_model=ExtractRequirementsResponse)
async def extract_requirements_endpoint(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    _: None = Depends(require_integrations),
):
    """Извлечь технические требования из документа (ГОСТ, материалы, размеры)."""
    if not await is_openai_configured(db):
        raise HTTPException(status_code=503, detail="AI недоступен: OPENAI_API_KEY не настроен")

    try:
        doc_uuid = UUID(document_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid document_id UUID")

    try:
        # 1. Get document chunks from Qdrant
        indexer = DocumentIndexer()
        chunks = await indexer.search(
            query="технические требования ГОСТ материалы размеры давление температура",
            top_k=50,
            document_id=doc_uuid,
        )

        if not chunks:
            return ExtractRequirementsResponse(
                document_id=document_id,
                requirements=[],
                extracted_at=str(datetime.now(timezone.utc)),
            )

        full_text = "\n\n".join(c["text"] for c in chunks)

        # 2. LLM extraction
        client = await get_ai_client(db)

        request_kwargs = {
            "model": settings.LLM_MODEL,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "Извлеки технические требования из документа. "
                        "Ответь строго JSON: {\"requirements\": [{\"type\": \"gost|material|dimension|pressure|temperature|other\", "
                        "\"value\": \"...\", \"description\": \"...\", \"section\": \"...\"}]}"
                    ),
                },
                {"role": "user", "content": full_text[:12000]},
            ],
            "max_tokens": 2000,
            "temperature": 0.1,
        }
        if supports_json_response_format():
            request_kwargs["response_format"] = {"type": "json_object"}
        response = await client.chat.completions.create(**request_kwargs)

        result = json.loads(response.choices[0].message.content)
        requirements = result.get("requirements", [])

        # 3. Persist to document.content
        from sqlalchemy import select
        from app.modules.documents.models import Document
        db_result = await db.execute(select(Document).where(Document.id == int(document_id)))
        doc = db_result.scalar_one_or_none()
        if doc and doc.content is not None and isinstance(doc.content, dict):
            doc.content["ai_requirements"] = {
                "requirements": requirements,
                "extracted_at": str(datetime.now(timezone.utc)),
            }
            await db.commit()

        return ExtractRequirementsResponse(
            document_id=document_id,
            requirements=requirements,
            extracted_at=str(datetime.now(timezone.utc)),
        )
    except Exception as exc:
        logger.warning("Requirements extraction failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Ошибка извлечения: {exc}")


# ---------------------------------------------------------------------------
# 3.5 Extract requirements text from uploaded DOCX/PDF file
# ---------------------------------------------------------------------------

class ExtractRequirementsFileResponse(BaseModel):
    text: str
    file_name: str


@router.post("/extract-requirements-file", response_model=ExtractRequirementsFileResponse)
async def extract_requirements_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
):
    """Извлечь текст из загруженного файла с требованиями (.docx или .pdf)."""
    allowed_exts = {".docx", ".pdf"}
    file_name = file.filename or ""
    ext = f".{file_name.lower().split('.')[-1]}" if "." in file_name else ""
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=400, detail="Поддерживаются только файлы .docx и .pdf"
        )

    try:
        contents = await file.read()
        parsed = ParserFactory.parse(BytesIO(contents), file_name)
        return ExtractRequirementsFileResponse(text=parsed.content, file_name=file_name)
    except Exception as exc:
        logger.warning("Requirements file extraction failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Ошибка извлечения текста: {exc}")
    finally:
        await file.close()


# ---------------------------------------------------------------------------
# 3.6 Compliance check against manually uploaded requirements
# ---------------------------------------------------------------------------

@router.post("/check-compliance", response_model=ComplianceCheckResponse)
async def check_compliance_endpoint(
    request: ComplianceCheckRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    _: None = Depends(require_integrations),
):
    """Проверить соответствие документа вручную загруженным требованиям."""
    if not await is_openai_configured(db):
        raise HTTPException(status_code=503, detail="AI недоступен: OPENAI_API_KEY не настроен")

    try:
        numeric_id = int(request.document_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid document_id")

    from sqlalchemy import select
    from app.modules.documents.models import Document

    db_result = await db.execute(select(Document).where(Document.id == numeric_id))
    doc = db_result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Документ не найден")

    document_text = ""
    if isinstance(doc.content, dict):
        body = doc.content.get("body")
        if isinstance(body, str):
            document_text = body
    if not document_text:
        document_text = f"{doc.number} {doc.name}".strip()

    requirements = request.requirements.strip()
    if not requirements:
        raise HTTPException(status_code=400, detail="Требования не могут быть пустыми")

    try:
        client = await get_ai_client(db)

        request_kwargs = {
            "model": settings.LLM_MODEL,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "Ты проверяешь соответствие документа списку требований. "
                        "Для каждого пункта требований укажи, соблюдено ли оно в документе. "
                        "Ответь строго JSON: {\"compliant\": true/false, \"findings\": [{\"requirement\": \"текст требования\", \"status\": \"ok|fail\", \"comment\": \"пояснение\"}]}. "
                        "Если требование соблюдено — status ok, иначе — fail и пояснение, чего не хватает."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Документ:\n{document_text[:8000]}\n\nТребования:\n{requirements[:4000]}",
                },
            ],
            "max_tokens": 2000,
            "temperature": 0.1,
        }
        if supports_json_response_format():
            request_kwargs["response_format"] = {"type": "json_object"}
        response = await client.chat.completions.create(**request_kwargs)

        result = json.loads(response.choices[0].message.content)
        findings = result.get("findings", [])
        compliant = result.get("compliant", all(f.get("status") == "ok" for f in findings))

        return ComplianceCheckResponse(
            document_id=request.document_id,
            compliant=compliant,
            findings=findings,
        )
    except Exception as exc:
        logger.warning("Compliance check failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Ошибка проверки: {exc}")


# ---------------------------------------------------------------------------
# Legacy / existing endpoints (keep compatibility)
# ---------------------------------------------------------------------------

@router.post("/inline-suggest")
async def inline_suggest_endpoint(
    request: dict,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_integrations),
):
    """Inline suggestions — REST fallback for WebSocket."""
    if not await is_openai_configured(db):
        return {"suggestions": [], "request_id": "", "model": "disabled"}

    try:
        ai = AIService(db)
        from app.ai.models import InlineSuggestionRequest
        req = InlineSuggestionRequest(**request)
        result = await ai.get_inline_suggestions(req)
        return {
            "suggestions": [
                {
                    "type": s.type,
                    "text": s.text,
                    "display": s.display,
                    "confidence": s.confidence,
                    "description": s.description,
                }
                for s in result.suggestions
            ],
            "request_id": str(result.request_id),
            "model": result.model,
        }
    except Exception as exc:
        logger.warning("Inline suggest failed: %s", exc)
        return {"suggestions": [], "request_id": "", "model": "error"}
