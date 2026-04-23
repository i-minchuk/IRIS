from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import Optional
from uuid import UUID, uuid4
import io

from app.ai.models import ChatRequest, ChatResponse, DocumentUploadRequest, DocumentAnalysisResult
from app.ai.service import AIService
from app.parser.factory import ParserFactory
from app.parser.indexer import DocumentIndexer
from app.core.config import settings
from app.db.session import get_db  # Ваша существующая сессия БД

router = APIRouter(prefix="/ai", tags=["AI"])
ai_service = AIService()
indexer = DocumentIndexer()

@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    project_id: Optional[UUID] = Form(None),
    db = Depends(get_db)
):
    """Загрузка и индексация документа"""
    # Проверяем тип файла
    allowed = ['.pdf', '.docx']
    if not any(file.filename.lower().endswith(ext) for ext in allowed):
        raise HTTPException(400, f"Разрешены только: {allowed}")
    
    # Читаем файл
    content = await file.read()
    
    # Парсим
    try:
        parsed = ParserFactory.parse(
            file_stream=io.BytesIO(content),
            file_name=file.filename
        )
    except Exception as e:
        raise HTTPException(400, f"Ошибка парсинга: {str(e)}")
    
    # Сохраняем в PostgreSQL (метаданные)
    # Здесь используйте вашу модель SQLAlchemy
    # ai_doc = AIDocument(
    #     original_document_id=...,
    #     file_name=file.filename,
    #     file_type=parsed.file_type,
    #     content=parsed.content[:10000],  # Обрезаем для БД
    #     metadata=parsed.metadata,
    #     status="indexing"
    # )
    # db.add(ai_doc)
    # db.commit()
    
    # Индексируем в Qdrant (в фоне или синхронно)
    # Для MVP — синхронно, чтобы сразу можно было спрашивать
    chunk_ids = await indexer.index(parsed, original_doc_id=uuid4())
    
    return JSONResponse({
        "document_id": str(parsed.document_id),
        "file_name": file.filename,
        "chunks_indexed": len(chunk_ids),
        "entities_found": {
            "standards": len([e for e in parsed.entities if e["type"] == "standard"]),
            "materials": len([e for e in parsed.entities if e["type"] == "material"]),
            "dimensions": len([e for e in parsed.entities if e["type"] == "dimension"])
        },
        "status": "indexed"
    })

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, db = Depends(get_db)):
    """Диалог с AI-ассистентом"""
    response = await ai_service.chat(request)
    
    # Сохраняем в историю
    # interaction = AIInteraction(
    #     session_id=request.session_id,
    #     user_id=...,  # Из текущего пользователя
    #     project_id=request.project_id,
    #     document_id=request.document_id,
    #     task_type="chat",
    #     query_text=request.message,
    #     response_text=response.content,
    #     confidence=response.confidence,
    #     model_version=settings.LLM_MODEL
    # )
    # db.add(interaction)
    # db.commit()
    
    return response

@router.post("/analyze/{document_id}", response_model=DocumentAnalysisResult)
async def analyze_document(document_id: UUID, db = Depends(get_db)):
    """Анализ документа на ошибки"""
    result = await ai_service.analyze_document(document_id)
    
    # Сохраняем результат анализа
    # analysis = AIAnalysis(
    #     document_id=document_id,
    #     analysis_type="full",
    #     overall_score=result.overall_score,
    #     findings=result.findings
    # )
    # db.add(analysis)
    # db.commit()
    
    return result

@router.get("/documents/{document_id}/status")
async def get_document_status(document_id: UUID):
    """Статус индексации документа"""
    # Проверяем в Qdrant
    try:
        points = indexer.qdrant.scroll(
            collection_name=settings.QDRANT_COLLECTION,
            filter={
                "must": [
                    {"key": "document_id", "match": {"value": str(document_id)}}
                ]
            },
            limit=1
        )
        is_indexed = len(points[0]) > 0
    except:
        is_indexed = False
    
    return {
        "document_id": str(document_id),
        "indexed": is_indexed,
        "qdrant_collection": settings.QDRANT_COLLECTION
    }