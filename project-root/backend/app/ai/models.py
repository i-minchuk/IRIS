from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from uuid import UUID
from enum import Enum

class TaskType(str, Enum):
    CHAT = "chat"
    ANALYZE = "analyze"

class DocumentType(str, Enum):
    PDF = "pdf"
    DOCX = "docx"

class ChatRequest(BaseModel):
    message: str = Field(..., max_length=10000)
    session_id: UUID
    document_id: Optional[UUID] = None
    project_id: Optional[UUID] = None
    stream: bool = False

class ChatResponse(BaseModel):
    response_id: UUID
    content: str
    confidence: float
    sources: List[Dict[str, Any]] = []  # Откуда взята информация
    requires_human_review: bool = False

class DocumentUploadRequest(BaseModel):
    project_id: Optional[UUID] = None
    document_type: DocumentType

class DocumentAnalysisResult(BaseModel):
    document_id: UUID
    overall_score: float
    findings: List[Dict[str, Any]]
    critical_count: int
    warning_count: int
    info_count: int

class ChunkMetadata(BaseModel):
    document_id: UUID
    chunk_index: int
    text: str
    section: Optional[str] = None
    page: Optional[int] = None
    score: Optional[float] = None