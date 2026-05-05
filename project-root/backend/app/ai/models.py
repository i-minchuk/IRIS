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


class InlineSuggestionItem(BaseModel):
    type: str = Field(..., pattern="^(completion|correction|reference)$")
    text: str
    display: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    description: Optional[str] = None


class InlineSuggestionRequest(BaseModel):
    document_id: Optional[UUID] = None
    document_type: Optional[str] = None
    current_section: Optional[str] = None
    preceding_text: str = Field(..., max_length=5000)
    current_line: str = Field(..., max_length=1000)
    cursor_position: int = Field(..., ge=0)


class InlineSuggestionResponse(BaseModel):
    suggestions: List[InlineSuggestionItem]
    request_id: UUID
    model: Optional[str] = None