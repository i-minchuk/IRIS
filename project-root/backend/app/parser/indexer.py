from qdrant_client import QdrantClient
from qdrant_client.models import PointStruct, Distance, VectorParams
from app.core.config import settings
from app.ai.embeddings import EmbeddingService
from app.parser.base import ParsedDocument
from typing import List, Dict, Any
import hashlib
import asyncio
from uuid import UUID, uuid4

class DocumentIndexer:
    def __init__(self):
        self.qdrant = QdrantClient(
            host=settings.QDRANT_HOST,
            port=settings.QDRANT_PORT
        )
        self.embedder = EmbeddingService()
        self.collection = settings.QDRANT_COLLECTION
        self.chunk_size = settings.CHUNK_SIZE
        self.chunk_overlap = settings.CHUNK_OVERLAP
        self._ensure_collection()
    
    def _ensure_collection(self):
        """Создаёт коллекцию, если не существует"""
        collections = self.qdrant.get_collections().collections
        exists = any(c.name == self.collection for c in collections)
        
        if not exists:
            # Размерность для text-embedding-3-large = 3072
            self.qdrant.create_collection(
                collection_name=self.collection,
                vectors_config=VectorParams(
                    size=3072,
                    distance=Distance.COSINE
                )
            )
    
    def _create_chunks(self, doc: ParsedDocument) -> List[Dict[str, Any]]:
        """Умное разбиение на чанки"""
        chunks = []
        
        # Если есть структурированные разделы — разбиваем по ним
        if doc.sections:
            for section in doc.sections:
                section_text = section["text"]
                
                if len(section_text) <= self.chunk_size:
                    chunks.append({
                        "text": section_text,
                        "section": f"{section['number']} {section['title']}".strip(),
                        "heading": section["title"],
                        "page": section.get("page"),
                        "level": section["level"]
                    })
                else:
                    # Большой раздел — разбиваем на подчанки
                    sub_chunks = self._split_text(section_text)
                    for i, sub in enumerate(sub_chunks):
                        chunks.append({
                            "text": sub,
                            "section": f"{section['number']} {section['title']}".strip(),
                            "heading": f"{section['title']} (часть {i+1})",
                            "page": section.get("page"),
                            "level": section["level"]
                        })
        else:
            # Нет структуры — простое разбиение
            for sub in self._split_text(doc.content):
                chunks.append({
                    "text": sub,
                    "section": "",
                    "heading": "",
                    "page": None,
                    "level": 0
                })
        
        return chunks
    
    def _split_text(self, text: str) -> List[str]:
        """Разбивает текст на чанки с перекрытием"""
        if len(text) <= self.chunk_size:
            return [text]
        
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + self.chunk_size
            
            # Ищем ближайший конец предложения
            if end < len(text):
                # Ищем точку, перевод строки или пробел
                for sep in ['\n\n', '. ', '\n', ' ']:
                    pos = text.rfind(sep, start, end)
                    if pos != -1:
                        end = pos + len(sep)
                        break
            
            chunks.append(text[start:end].strip())
            start = end - self.chunk_overlap
        
        return chunks
    
    async def index(self, doc: ParsedDocument, original_doc_id: UUID) -> List[str]:
        """Индексация документа в Qdrant"""
        # 1. Разбиваем на чанки
        chunks = self._create_chunks(doc)
        
        if not chunks:
            return []
        
        # 2. Генерируем эмбеддинги
        texts = [c["text"] for c in chunks]
        embeddings = await self.embedder.embed(texts)
        
        # 3. Сохраняем в Qdrant
        points = []
        chunk_ids = []
        
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            chunk_id = hashlib.md5(
                f"{doc.document_id}:{i}".encode()
            ).hexdigest()
            
            points.append(PointStruct(
                id=chunk_id,
                vector=embedding,
                payload={
                    "document_id": str(doc.document_id),
                    "original_document_id": str(original_doc_id),
                    "chunk_index": i,
                    "text": chunk["text"],
                    "section": chunk.get("section", ""),
                    "heading": chunk.get("heading", ""),
                    "page": chunk.get("page"),
                    "file_name": doc.file_name,
                    "file_type": doc.file_type
                }
            ))
            chunk_ids.append(chunk_id)
        
        self.qdrant.upsert(
            collection_name=self.collection,
            points=points
        )
        
        return chunk_ids
    
    async def search(self, query: str, top_k: int = 5, 
                     document_id: UUID = None) -> List[Dict[str, Any]]:
        """Поиск похожих чанков"""
        query_embedding = await self.embedder.embed_single(query)
        
        filter_conditions = None
        if document_id:
            filter_conditions = {
                "must": [
                    {"key": "document_id", "match": {"value": str(document_id)}}
                ]
            }
        
        results = self.qdrant.search(
            collection_name=self.collection,
            query_vector=query_embedding,
            limit=top_k,
            query_filter=filter_conditions,
            with_payload=True
        )
        
        return [
            {
                "chunk_id": r.id,
                "score": r.score,
                "text": r.payload["text"],
                "section": r.payload.get("section", ""),
                "heading": r.payload.get("heading", ""),
                "page": r.payload.get("page"),
                "document_id": r.payload["document_id"],
                "file_name": r.payload["file_name"]
            }
            for r in results
        ]