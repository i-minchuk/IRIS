# Модуль: AI (ИИ-ассистент)

## Назначение
RAG-диалог, inline-подсказки, анализ документов через OpenAI + Qdrant. Отдельный слой, не привязан к module level.

## Файлы
```
backend/app/ai/
  service.py     # AIService
  models.py      # Pydantic: ChatRequest, DocumentAnalysisResult, InlineSuggestionItem
  prompts.py     # RAG_SYSTEM_PROMPT, ANALYSIS_SYSTEM_PROMPT, INLINE_SUGGESTION_PROMPT
  embeddings.py  # EmbeddingService (OpenAI text-embedding-3-large)

backend/app/parser/
  indexer.py     # DocumentIndexer (Qdrant)
  factory.py, pdf_parser.py, docx_parser.py, base.py
```

## AIService
- `chat()` — RAG-диалог: поиск top-5 чанков → контекст → GPT-4o → ответ с confidence
- `get_inline_suggestions()` — автодополнение при редактировании
- `analyze_document()` — полный анализ (структура, ГОСТ, технические ошибки), JSON output

## Prompts
- `RAG_SYSTEM_PROMPT` — контекст для диалога
- `ANALYSIS_SYSTEM_PROMPT` — формат JSON с score и findings
- `INLINE_SUGGESTION_PROMPT` — автодополнение

## Эндпоинты
- `/api/routes/ai.py` — legacy роутер (не в `api_router`)
- `/ws/ai/inline/{client_id}` — WebSocket для inline suggestions

## Зависимости
- OpenAI API, Qdrant, tiktoken
- `app.parser.indexer` — Qdrant vector store

## Правила параллельной разработки
- **НЕ менять** формат JSON-ответа `analyze_document()` без обновления frontend
- `OPENAI_API_KEY` имеет дефолт для CI
- Qdrant — отдельный сервис в docker-compose
