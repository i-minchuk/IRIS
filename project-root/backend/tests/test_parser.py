import pytest
from io import BytesIO
from app.parser.factory import ParserFactory
from app.parser.pdf_parser import PDFParser

def test_pdf_structure_extraction():
    """Тест извлечения структуры из PDF"""
    # Создайте тестовый PDF или используйте мок
    parser = PDFParser()
    
    # Минимальный тест на логику
    assert parser._detect_heading_level(18, True, "1. Общие положения") == 1
    assert parser._detect_heading_level(12, False, "Обычный текст") == 0
    assert parser._extract_section_number("1.2.3 Заголовок") == "1.2.3"

def test_entity_extraction():
    """Тест извлечения технических сущностей"""
    parser = PDFParser()
    text = "Трубы по ГОСТ 3262-75, материал ст.20, диаметр DN100, давление 1.6 МПа"
    
    entities = parser._extract_entities(text)
    
    standards = [e for e in entities if e["type"] == "standard"]
    materials = [e for e in entities if e["type"] == "material"]
    dimensions = [e for e in entities if e["type"] == "dimension"]
    pressures = [e for e in entities if e["type"] == "pressure"]
    
    assert len(standards) == 1
    assert standards[0]["value"] == "ГОСТ 3262-75"
    assert len(materials) == 1
    assert len(dimensions) == 1
    assert len(pressures) == 1