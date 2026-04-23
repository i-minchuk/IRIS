from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import BinaryIO, List, Dict, Any, Optional
from uuid import UUID

@dataclass
class ParsedDocument:
    document_id: UUID
    file_name: str
    file_type: str
    content: str  # Полный текст
    sections: List[Dict[str, Any]]  # Структура: [{number, title, level, text}]
    metadata: Dict[str, Any]
    entities: List[Dict[str, Any]]  # Технические сущности

class BaseParser(ABC):
    @abstractmethod
    def parse(self, file_stream: BinaryIO, file_name: str) -> ParsedDocument:
        pass
    
    @abstractmethod
    def supports(self, file_type: str) -> bool:
        pass