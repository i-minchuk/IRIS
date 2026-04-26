import fitz  # PyMuPDF
import re
import io
from typing import BinaryIO, List, Dict, Any
from .base import BaseParser, ParsedDocument
from uuid import uuid4

class PDFParser(BaseParser):
    def supports(self, file_type: str) -> bool:
        return file_type.lower() == 'pdf'
    
    def parse(self, file_stream: BinaryIO, file_name: str) -> ParsedDocument:
        doc = fitz.open(stream=file_stream.read(), filetype="pdf")
        
        full_text = []
        sections = []
        current_section = None
        
        for page_num, page in enumerate(doc):
            blocks = page.get_text("dict")["blocks"]
            
            for block in blocks:
                if block.get("type") != 0:  # Не текстовый блок
                    continue
                
                for line in block.get("lines", []):
                    line_text = " ".join(
                        span["text"] for span in line.get("spans", [])
                    ).strip()
                    
                    if not line_text:
                        continue
                    
                    # Определяем уровень заголовка по шрифту
                    font_size = line["spans"][0]["size"] if line["spans"] else 12
                    is_bold = line["spans"][0].get("flags", 0) & 2 ** 4 != 0
                    
                    level = self._detect_heading_level(font_size, is_bold, line_text)
                    
                    if level > 0:
                        # Это заголовок — новый раздел
                        section = {
                            "number": self._extract_section_number(line_text),
                            "title": self._clean_title(line_text),
                            "level": level,
                            "page": page_num + 1,
                            "text": []
                        }
                        sections.append(section)
                        current_section = section
                    else:
                        # Обычный текст
                        full_text.append(line_text)
                        if current_section:
                            current_section["text"].append(line_text)
        
        # Преобразуем текст разделов в строки
        for section in sections:
            section["text"] = "\n".join(section["text"])
        
        content = "\n".join(full_text)
        entities = self._extract_entities(content)
        
        return ParsedDocument(
            document_id=uuid4(),
            file_name=file_name,
            file_type="pdf",
            content=content,
            sections=sections,
            metadata={
                "page_count": len(doc),
                "title": doc.metadata.get("title", ""),
                "author": doc.metadata.get("author", "")
            },
            entities=entities
        )
    
    def _detect_heading_level(self, font_size: float, is_bold: bool, text: str) -> int:
        """Определяет уровень заголовка"""
        # Числовой паттерн: "1.", "1.1.", "1.1.1."
        has_number = bool(re.match(r'^\s*\d+(\.\d+)*\s+', text))
        
        if font_size >= 16 or (is_bold and font_size >= 14):
            return 1 if has_number else 1
        elif font_size >= 13 or (is_bold and font_size >= 12):
            return 2 if has_number else 2
        elif has_number and font_size >= 11:
            return 3
        return 0
    
    def _extract_section_number(self, text: str) -> str:
        match = re.match(r'^\s*(\d+(?:\.\d+)*)\s+', text)
        return match.group(1) if match else ""
    
    def _clean_title(self, text: str) -> str:
        return re.sub(r'^\s*\d+(?:\.\d+)*\s+', '', text).strip()
    
    def _extract_entities(self, text: str) -> List[Dict[str, Any]]:
        """Извлекает ГОСТы, материалы, размеры"""
        entities = []
        
        # ГОСТы
        for match in re.finditer(r'ГОСТ\s+(?:Р\s+)?\d+(?:-\d+)+(?:\s*\*)?', text):
            entities.append({
                "type": "standard",
                "value": match.group(),
                "position": match.span()
            })
        
        # Материалы (ст.20, ст.09Г2С и т.д.) — требуем цифру после "ст." и границу слова
        for match in re.finditer(r'(?<!\w)ст\.?\s*\d+[А-Я\d]*(?:Г2С|ХМ|НМ)?', text, re.I):
            entities.append({
                "type": "material",
                "value": match.group(),
                "position": match.span()
            })
        
        # Размеры (DN, Ду, Ø)
        for match in re.finditer(r'(?:DN|dn|Ду|Ø|⌀)\s*\d+(?:\s*мм)?', text):
            entities.append({
                "type": "dimension",
                "value": match.group(),
                "position": match.span()
            })
        
        # Давление
        for match in re.finditer(r'\d+(?:[,.]\d+)?\s*(?:МПа|кгс/см²|бар)', text):
            entities.append({
                "type": "pressure",
                "value": match.group(),
                "position": match.span()
            })
        
        return entities