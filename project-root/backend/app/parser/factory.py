from typing import BinaryIO
from .base import BaseParser, ParsedDocument
from .pdf_parser import PDFParser
from .docx_parser import DOCXParser

class ParserFactory:
    _parsers = [PDFParser(), DOCXParser()]
    
    @classmethod
    def get_parser(cls, file_name: str) -> BaseParser:
        ext = file_name.lower().split('.')[-1]
        for parser in cls._parsers:
            if parser.supports(ext):
                return parser
        raise ValueError(f"Нет парсера для .{ext}")
    
    @classmethod
    def parse(cls, file_stream: BinaryIO, file_name: str) -> ParsedDocument:
        parser = cls.get_parser(file_name)
        return parser.parse(file_stream, file_name)