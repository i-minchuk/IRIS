import pytest
from unittest.mock import AsyncMock, MagicMock
from app.ai.service import AIService
from app.ai.models import ChatRequest
from uuid import uuid4


def _make_service(chunks, llm_content):
    """AIService с моками индексатора (Qdrant) и LLM-клиента."""
    service = AIService(db=AsyncMock())
    indexer = MagicMock()
    indexer.search = AsyncMock(return_value=chunks)
    service._indexer = indexer  # обход ленивого создания DocumentIndexer (Qdrant)
    client = MagicMock()
    client.chat.completions.create = AsyncMock(
        return_value=MagicMock(
            choices=[MagicMock(message=MagicMock(content=llm_content))]
        )
    )
    service._client = client  # обход _async_client / get_ai_client (сеть)
    return service


@pytest.mark.asyncio
async def test_chat_with_context():
    """Тест RAG-диалога"""
    service = _make_service(
        chunks=[
            {
                "text": "ГОСТ 3262-75 применяется для трубопроводов",
                "score": 0.95,
                "file_name": "test.pdf",
                "section": "1. Трубопроводы",
                "page": 5,
                "document_id": str(uuid4()),
            }
        ],
        llm_content="ГОСТ 3262-75",
    )

    request = ChatRequest(
        message="Какой ГОСТ для труб?",
        session_id=uuid4(),
    )

    response = await service.chat(request)

    assert response.confidence > 0.5
    assert len(response.sources) == 1
    assert not response.requires_human_review  # Высокая уверенность


@pytest.mark.asyncio
async def test_confidence_low_when_no_context():
    """Тест: низкая уверенность при отсутствии контекста"""
    service = _make_service(chunks=[], llm_content="Я не уверен...")

    request = ChatRequest(
        message="Что-то неизвестное",
        session_id=uuid4(),
    )

    response = await service.chat(request)

    assert response.confidence < 0.7
    assert response.requires_human_review
