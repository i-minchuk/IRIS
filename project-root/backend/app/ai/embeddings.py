from typing import List

from app.core.ai_key import get_ai_client_from_settings
from app.core.config import settings


class EmbeddingService:
    def __init__(self):
        self._client = None
        self.model = settings.EMBEDDING_MODEL

    async def _async_client(self):
        if self._client is None:
            self._client = await get_ai_client_from_settings()
        return self._client

    async def embed(self, texts: List[str], batch_size: int = 100) -> List[List[float]]:
        """Генерирует эмбеддинги батчами"""
        all_embeddings = []
        client = await self._async_client()

        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            response = await client.embeddings.create(
                model=self.model,
                input=batch
            )
            all_embeddings.extend([item.embedding for item in response.data])

        return all_embeddings

    async def embed_single(self, text: str) -> List[float]:
        """Один текст → один эмбеддинг"""
        result = await self.embed([text])
        return result[0]
