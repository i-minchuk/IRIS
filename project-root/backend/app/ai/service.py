from functools import lru_cache
from openai import AsyncOpenAI
from app.core.config import settings
from app.parser.indexer import DocumentIndexer
from app.ai.prompts import RAG_SYSTEM_PROMPT, ANALYSIS_SYSTEM_PROMPT
from app.ai.models import ChatRequest, ChatResponse, DocumentAnalysisResult
from typing import List, Dict, Any, Optional
from uuid import UUID, uuid4
import json
import tiktoken

class AIService:
    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_BASE_URL
        )
        self._indexer = None
        self.model = settings.LLM_MODEL
        self.max_tokens = settings.MAX_CONTEXT_TOKENS

    @property
    def indexer(self):
        if self._indexer is None:
            self._indexer = DocumentIndexer()
        return self._indexer
    
    def _count_tokens(self, text: str) -> int:
        """Подсчёт токенов для контроля контекста"""
        encoding = tiktoken.encoding_for_model(self.model)
        return len(encoding.encode(text))
    
    def _format_context(self, chunks: List[Dict[str, Any]]) -> str:
        """Форматирует чанки в контекст для LLM"""
        context_parts = []
        
        for i, chunk in enumerate(chunks):
            source = f"[Источник {i+1}]"
            if chunk.get("file_name"):
                source += f" {chunk['file_name']}"
            if chunk.get("section"):
                source += f", раздел: {chunk['section']}"
            if chunk.get("page"):
                source += f", стр. {chunk['page']}"
            
            context_parts.append(f"{source}\n{chunk['text']}\n")
        
        return "\n---\n".join(context_parts)
    
    async def chat(self, request: ChatRequest) -> ChatResponse:
        """RAG-диалог с AI"""
        # 1. Ищем релевантные чанки
        chunks = await self.indexer.search(
            query=request.message,
            top_k=5,
            document_id=request.document_id
        )
        
        # 2. Формируем контекст
        context = self._format_context(chunks)
        
        # Проверяем размер контекста
        context_tokens = self._count_tokens(context)
        if context_tokens > self.max_tokens * 0.7:  # 70% на контекст
            # Обрезаем, оставляем самые релевантные
            chunks = chunks[:3]
            context = self._format_context(chunks)
        
        # 3. Формируем сообщения
        messages = [
            {"role": "system", "content": RAG_SYSTEM_PROMPT},
            {"role": "system", "content": f"Контекст из документов:\n\n{context}"},
            {"role": "user", "content": request.message}
        ]
        
        # 4. Запрос к LLM
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.2,
            max_tokens=2000
        )
        
        content = response.choices[0].message.content
        
        # 5. Оценка confidence (эвристика)
        confidence = self._estimate_confidence(content, chunks)
        
        # 6. Формируем источники
        sources = [
            {
                "document_id": c["document_id"],
                "file_name": c["file_name"],
                "section": c.get("section", ""),
                "page": c.get("page"),
                "relevance_score": c["score"]
            }
            for c in chunks
        ]
        
        return ChatResponse(
            response_id=uuid4(),
            content=content,
            confidence=confidence,
            sources=sources,
            requires_human_review=confidence < 0.7
        )
    
    def _estimate_confidence(self, response: str, chunks: List[Dict]) -> float:
        """Оценка уверенности ответа (0-1)"""
        score = 0.5
        
        # +0.3 если использованы источники
        if chunks and any(c["score"] > 0.8 for c in chunks):
            score += 0.3
        
        # +0.1 если ответ содержит ссылки на источники
        if any(marker in response for marker in ["Источник", "документ", "раздел", "ГОСТ"]):
            score += 0.1
        
        # -0.3 если есть признаки галлюцинации
        hallucination_markers = [
            "я не уверен", "возможно", "скорее всего", "вероятно",
            "не могу найти", "информация отсутствует"
        ]
        if any(marker in response.lower() for marker in hallucination_markers):
            score -= 0.3
        
        # -0.2 если ответ слишком короткий или слишком длинный
        if len(response) < 50 or len(response) > 3000:
            score -= 0.2
        
        return max(0.0, min(1.0, score))
    
    async def analyze_document(self, document_id: UUID) -> DocumentAnalysisResult:
        """Анализ документа на ошибки"""
        # 1. Получаем все чанки документа
        # (специальный поиск с фильтром по document_id и большим top_k)
        chunks = await self.indexer.search(
            query="анализ структуры документа проверка ГОСТ ошибки",
            top_k=50,
            document_id=document_id
        )
        
        # 2. Формируем полный текст документа
        full_text = "\n\n".join(c["text"] for c in chunks)
        
        # 3. Запрос на анализ
        messages = [
            {"role": "system", "content": ANALYSIS_SYSTEM_PROMPT},
            {"role": "user", "content": f"Проанализируй документ:\n\n{full_text[:10000]}"}
        ]
        
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.1,
            response_format={"type": "json_object"},
            max_tokens=3000
        )
        
        # 4. Парсим JSON
        try:
            result = json.loads(response.choices[0].message.content)
        except json.JSONDecodeError:
            result = {
                "overall_score": 0,
                "findings": [{
                    "severity": "warning",
                    "category": "technical",
                    "description": "Не удалось распарсить ответ AI",
                    "suggestion": "Повторите анализ"
                }]
            }
        
        # 5. Подсчёт
        findings = result.get("findings", [])
        critical = len([f for f in findings if f.get("severity") == "critical"])
        warnings = len([f for f in findings if f.get("severity") == "warning"])
        info = len([f for f in findings if f.get("severity") == "info"])
        
        return DocumentAnalysisResult(
            document_id=document_id,
            overall_score=result.get("overall_score", 0),
            findings=findings,
            critical_count=critical,
            warning_count=warnings,
            info_count=info
        )