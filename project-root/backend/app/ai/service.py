from functools import lru_cache
from openai import AsyncOpenAI
from app.core.config import settings
from app.parser.indexer import DocumentIndexer
from app.ai.prompts import RAG_SYSTEM_PROMPT, ANALYSIS_SYSTEM_PROMPT, INLINE_SUGGESTION_PROMPT
from app.ai.models import ChatRequest, ChatResponse, DocumentAnalysisResult, InlineSuggestionRequest, InlineSuggestionResponse, InlineSuggestionItem
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
    
    async def get_inline_suggestions(self, request: InlineSuggestionRequest) -> InlineSuggestionResponse:
        """Inline автодополнение при редактировании документа"""
        # 1. Ищем релевантные чанки документа
        context_chunks = []
        if request.document_id:
            context_chunks = await self.indexer.search(
                query=request.current_line[-200:] if len(request.current_line) > 200 else request.current_line,
                top_k=3,
                document_id=request.document_id
            )
        
        doc_context = self._format_context(context_chunks) if context_chunks else ""
        
        # 2. Формируем промпт
        prompt = INLINE_SUGGESTION_PROMPT.format(
            document_type=request.document_type or "неизвестно",
            current_section=request.current_section or "неизвестно",
            preceding_text=request.preceding_text[-500:] if len(request.preceding_text) > 500 else request.preceding_text,
            current_line=request.current_line
        )
        
        messages = [
            {"role": "system", "content": prompt},
            {"role": "system", "content": f"Контекст документа:\n{doc_context}" if doc_context else ""},
            {"role": "user", "content": f"Предложи автодополнение для: \"{request.current_line}\""}
        ]
        
        # Убираем пустые сообщения
        messages = [m for m in messages if m["content"]]
        
        # 3. Запрос к LLM
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.15,
                max_tokens=500
            )
            content = response.choices[0].message.content
        except Exception:
            # Fallback: heuristic suggestions
            return self._heuristic_suggestions(request)
        
        # 4. Парсим ответ
        suggestions = self._parse_inline_suggestions(content, request)
        
        # Если LLM не дал результатов — fallback на эвристики
        if not suggestions:
            return self._heuristic_suggestions(request)
        
        return InlineSuggestionResponse(
            suggestions=suggestions,
            request_id=uuid4(),
            model=self.model
        )
    
    def _parse_inline_suggestions(self, content: str, request: InlineSuggestionRequest) -> List[InlineSuggestionItem]:
        """Парсит ответ LLM в структурированные подсказки"""
        suggestions = []
        current_line = request.current_line
        
        # Пытаемся найти JSON
        try:
            # Ищем JSON массив или объект в ответе
            json_start = content.find('[')
            json_end = content.rfind(']')
            if json_start != -1 and json_end != -1 and json_end > json_start:
                data = json.loads(content[json_start:json_end+1])
                for item in data:
                    suggestions.append(InlineSuggestionItem(
                        type=item.get("type", "completion"),
                        text=item.get("text", ""),
                        display=item.get("display", item.get("text", "")),
                        confidence=min(1.0, max(0.0, item.get("confidence", 0.8))),
                        description=item.get("description")
                    ))
                return suggestions
        except (json.JSONDecodeError, Exception):
            pass
        
        # Fallback: парсим текстовый формат
        lines = content.split('\n')
        for line in lines:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            
            # Ищем паттерны: "completion: текст" или "- тип: текст"
            if ':' in line:
                parts = line.split(':', 1)
                sugg_type = parts[0].strip().lower()
                text = parts[1].strip().strip('"').strip("'")
                
                if sugg_type in ('completion', 'correction', 'reference') and text:
                    display_prefix = {'completion': '✨', 'correction': '✎', 'reference': '📖'}.get(sugg_type, '•')
                    suggestions.append(InlineSuggestionItem(
                        type=sugg_type,
                        text=text,
                        display=f"{display_prefix} {text}",
                        confidence=0.75,
                        description=None
                    ))
        
        return suggestions[:3]  # Максимум 3 подсказки
    
    def _heuristic_suggestions(self, request: InlineSuggestionRequest) -> InlineSuggestionResponse:
        """Эвристические подсказки как fallback"""
        suggestions = []
        current_line = request.current_line
        
        # ГОСТ mention → suggest ГОСТ 3262-75
        if "ГОСТ" in current_line and not any(c.isdigit() for c in current_line.split("ГОСТ")[-1][:10]):
            suggestions.append(InlineSuggestionItem(
                type="reference",
                text="ГОСТ 3262-75",
                display="📖 ГОСТ 3262-75",
                confidence=0.85,
                description="Стандартный ГОСТ для трубопроводов"
            ))
        
        # DN/Ду/мм → suggest DN100
        if any(x in current_line for x in ["DN", "Ду", "мм"]):
            suggestions.append(InlineSuggestionItem(
                type="completion",
                text="DN100 (Ду 100 мм)",
                display="✨ DN100 (Ду 100 мм)",
                confidence=0.9,
                description="Стандартный диаметр"
            ))
        
        # Материал mention
        if any(x in current_line.lower() for x in ["сталь", "steel", "материал"]):
            suggestions.append(InlineSuggestionItem(
                type="reference",
                text="Сталь 09Г2С",
                display="📖 Сталь 09Г2С",
                confidence=0.8,
                description="Конструкционная сталь"
            ))
        
        return InlineSuggestionResponse(
            suggestions=suggestions,
            request_id=uuid4(),
            model="heuristic"
        )

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