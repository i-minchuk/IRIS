"""AI router — v0.3.0 endpoints: semantic search, document analysis, RAG chat, requirements extraction."""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.auth.deps import get_current_active_user
from app.modules.auth.models import User
from app.ai.service import AIService
from app.ai.classification import classify_document
from app.ai.autofill import suggest_document_fields
from app.parser.indexer import DocumentIndexer
from app.core.config import settings

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
    current_user: User = Depends(get_current_active_user),
):
    """Семантический поиск по документам через Qdrant + embeddings."""
    if not settings.OPENAI_API_KEY:
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
):
    """AI-анализ документа на ошибки, структуру, ГОСТ."""
    if not settings.OPENAI_API_KEY:
        raise HTTPException(status_code=503, detail="AI недоступен: OPENAI_API_KEY не настроен")

    try:
        doc_uuid = UUID(document_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid document_id UUID")

    try:
        ai = AIService()
        result = await ai.analyze_document(doc_uuid)

        # Persist result to DB (optional — store in document.content or new field)
        from sqlalchemy import select
        from app.modules.documents.models import Document
        db_result = await db.execute(select(Document).where(Document.id == int(document_id)))
        doc = db_result.scalar_one_or_none()
        if doc and doc.content is not None and isinstance(doc.content, dict):
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
    except Exception as exc:
        logger.warning("Document analysis failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Ошибка анализа: {exc}")


# ---------------------------------------------------------------------------
# 3.4 RAG Chat
# ---------------------------------------------------------------------------

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(
    request: ChatRequest,
    current_user: User = Depends(get_current_active_user),
):
    """RAG-чат с AI — ответы на основе документов из Qdrant."""
    if not settings.OPENAI_API_KEY:
        raise HTTPException(status_code=503, detail="AI недоступен: OPENAI_API_KEY не настроен")

    try:
        ai = AIService()
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
):
    """Извлечь технические требования из документа (ГОСТ, материалы, размеры)."""
    if not settings.OPENAI_API_KEY:
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
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY, base_url=settings.OPENAI_BASE_URL)

        response = await client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=[
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
            response_format={"type": "json_object"},
            max_tokens=2000,
            temperature=0.1,
        )

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
# Legacy / existing endpoints (keep compatibility)
# ---------------------------------------------------------------------------

@router.post("/inline-suggest")
async def inline_suggest_endpoint(request: dict):
    """Inline suggestions — REST fallback for WebSocket."""
    if not settings.OPENAI_API_KEY:
        return {"suggestions": [], "request_id": "", "model": "disabled"}

    try:
        ai = AIService()
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
