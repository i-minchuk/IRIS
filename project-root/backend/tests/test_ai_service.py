import pytest
from unittest.mock import AsyncMock, patch
from app.ai.service import AIService
from app.ai.models import ChatRequest
from uuid import uuid4

@pytest.mark.asyncio
async def test_chat_with_context():
    """Тест RAG-диалога"""
    service = AIService()
    
    # Мокаем поиск
    with patch.object(service.indexer, 'search', new_callable=AsyncMock) as mock_search:
        mock_search.return_value = [
            {
                "text": "ГОСТ 3262-75 применяется для трубопроводов",
                "score": 0.95,
                "file_name": "test.pdf",
                "section": "1. Трубопроводы",
                "page": 5,
                "document_id": str(uuid4())
            }
        ]
        
        request = ChatRequest(
            message="Какой ГОСТ для труб?",
            session_id=uuid4()
        )
        
        # Мокаем LLM
        with patch.object(service.client.chat.completions, 'create', new_callable=AsyncMock) as mock_llm:
            mock_llm.return_value = AsyncMock(
                choices=[AsyncMock(message=AsyncMock(content="ГОСТ 3262-75"))]
            )
            
            response = await service.chat(request)
            
            assert response.confidence > 0.5
            assert len(response.sources) == 1
            assert not response.requires_human_review  # Высокая уверенность

@pytest.mark.asyncio
async def test_confidence_low_when_no_context():
    """Тест: низкая уверенность при отсутствии контекста"""
    service = AIService()
    
    with patch.object(service.indexer, 'search', new_callable=AsyncMock) as mock_search:
        mock_search.return_value = []  # Нет контекста
        
        request = ChatRequest(
            message="Что-то неизвестное",
            session_id=uuid4()
        )
        
        with patch.object(service.client.chat.completions, 'create', new_callable=AsyncMock) as mock_llm:
            mock_llm.return_value = AsyncMock(
                choices=[AsyncMock(message=AsyncMock(content="Я не уверен..."))]
            )
            
            response = await service.chat(request)
            
            assert response.confidence < 0.7
            assert response.requires_human_review