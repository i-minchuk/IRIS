from openai import AsyncOpenAI
from app.core.config import settings
from typing import List

class EmbeddingService:
    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_BASE_URL
        )
        self.model = settings.EMBEDDING_MODEL
    
    async def embed(self, texts: List[str]) -> List[List[float]]:
        """Генерирует эмбеддинги для списка текстов"""
        response = await self.client.embeddings.create(
            model=self.model,
            input=texts
        )
        return [item.embedding for item in response.data]
    
    async def embed_single(self, text: str) -> List[float]:
        """Один текст → один эмбеддинг"""
        result = await self.embed([text])
        return result[0]