"""CAD file parser — DWG/DXF metadata extraction and thumbnail generation."""
from __future__ import annotations

import logging
import struct
from typing import Any, Dict, List, Optional, BinaryIO
from dataclasses import dataclass
from uuid import UUID

from app.parser.base import BaseParser, ParsedDocument

logger = logging.getLogger(__name__)


@dataclass
class DWGHeader:
    """DWG file header metadata."""
    version: str
    version_code: str
    thumbnail_offset: Optional[int] = None
    thumbnail_size: Optional[int] = None
    codepage: int = 0
    num_sections: int = 0


class DWGParser(BaseParser):
    """Parse DWG files — extract metadata and thumbnail info."""

    DWG_VERSIONS = {
        b'AC1.2': 'AutoCAD R2.0',
        b'AC1.40': 'AutoCAD R2.05',
        b'AC1.50': 'AutoCAD R2.10',
        b'AC2.10': 'AutoCAD R2.5',
        b'AC2.21': 'AutoCAD R2.6',
        b'AC1002': 'AutoCAD R9',
        b'AC1003': 'AutoCAD R10',
        b'AC1004': 'AutoCAD R11/R12',
        b'AC1006': 'AutoCAD R13',
        b'AC1009': 'AutoCAD R14',
        b'AC1012': 'AutoCAD 2000',
        b'AC1014': 'AutoCAD 2000i',
        b'AC1015': 'AutoCAD 2002',
        b'AC1018': 'AutoCAD 2004',
        b'AC1021': 'AutoCAD 2007',
        b'AC1024': 'AutoCAD 2010',
        b'AC1027': 'AutoCAD 2013',
        b'AC1032': 'AutoCAD 2018',
    }

    def supports(self, file_type: str) -> bool:
        return file_type.lower() in ('dwg', 'dxf')

    def parse(self, file_stream: BinaryIO, file_name: str) -> ParsedDocument:
        """Parse DWG/DXF and extract metadata."""
        header = file_stream.read(6)
        file_stream.seek(0)

        version = 'Unknown'
        version_code = header.decode('ascii', errors='ignore')[:6]
        for code, name in self.DWG_VERSIONS.items():
            if header.startswith(code):
                version = name
                break

        # Extract basic metadata
        metadata = {
            'version': version,
            'version_code': version_code,
            'file_type': 'DWG',
            'file_name': file_name,
        }

        # Try to read more header info for newer versions
        if version_code.startswith('AC10'):
            try:
                file_stream.seek(0x0D)
                codepage = struct.unpack('<H', file_stream.read(2))[0]
                metadata['codepage'] = codepage
            except Exception:
                pass

        return ParsedDocument(
            document_id=UUID(int=0),
            file_name=file_name,
            file_type='dwg',
            content=f'[DWG file: {file_name}, Version: {version}]',
            sections=[{
                'number': '1',
                'title': 'File Header',
                'level': 1,
                'text': f'Version: {version}, Code: {version_code}',
                'page': 1,
            }],
            metadata=metadata,
            entities=[],
        )


class DXFParser(BaseParser):
    """Parse DXF files — extract entities and metadata."""

    def supports(self, file_type: str) -> bool:
        return file_type.lower() == 'dxf'

    def parse(self, file_stream: BinaryIO, file_name: str) -> ParsedDocument:
        """Parse DXF text format."""
        content = file_stream.read().decode('utf-8', errors='ignore')

        sections = []
        entities = []

        # Extract section names
        lines = content.split('\n')
        current_section = None
        section_text = []

        for i, line in enumerate(lines):
            line = line.strip()
            if line == 'SECTION':
                current_section = {'start': i, 'name': None}
                section_text = []
            elif line == 'ENDSEC' and current_section:
                sections.append({
                    'number': str(len(sections) + 1),
                    'title': current_section.get('name', 'Unknown'),
                    'level': 1,
                    'text': '\n'.join(section_text[:50]),  # First 50 lines
                    'page': None,
                })
                current_section = None
            elif current_section and line == '2':
                # Next line is section name
                if i + 1 < len(lines):
                    current_section['name'] = lines[i + 1].strip()
            elif current_section:
                section_text.append(line)

        # Extract entities (simplified)
        if 'ENTITIES' in content:
            entity_count = content.count('  0\n')
            entities.append({'type': 'entity_count', 'value': entity_count})

        metadata = {
            'file_type': 'DXF',
            'file_name': file_name,
            'section_count': len(sections),
            'entity_count': len(entities),
        }

        return ParsedDocument(
            document_id=UUID(int=0),
            file_name=file_name,
            file_type='dxf',
            content=content[:5000],  # First 5000 chars
            sections=sections,
            metadata=metadata,
            entities=entities,
        )
