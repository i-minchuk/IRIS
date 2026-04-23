from openai import AsyncOpenAI
from app.core.config import settings
from typing import List

class EmbeddingService:
    def __init__(self):
        if not settings.OPENAI_API_KEY:
            raise RuntimeError(
                "OPENAI_API_KEY не задан. "
                "Установите переменную окружения для работы AI-модулей."
            )
        self.client = AsyncOpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_BASE_URL
        )
        self.model = settings.EMBEDDING_MODEL
    
    async def embed(self, texts: List[str], batch_size: int = 100) -> List[List[float]]:
        """Генерирует эмбеддинги батчами"""
        all_embeddings = []
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            response = await self.client.embeddings.create(
                model=self.model,
                input=batch
            )
            all_embeddings.extend([item.embedding for item in response.data])
        
        return all_embeddings
    
    async def embed_single(self, text: str) -> List[float]:
        """Один текст → один эмбеддинг"""
        result = await self.embed([text])
        return result[0]