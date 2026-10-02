"""Генерация титульного листа документа (ГОСТ-рамка + основная надпись) в PDF.

Используется эндпоинтом GET /documents/{id}/title-sheet и Celery-задачей
app.tasks.documents.generate_pdf. Шрифт DejaVuSans bundled в app/assets/fonts
(без него кириллица в PDF не отображается — встроенные шрифты PyMuPDF
латинские / CJK-only, см. reports/exporters.py).
"""
from __future__ import annotations

from pathlib import Path
from typing import Any

import fitz  # PyMuPDF
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.models import User
from app.modules.documents.models import Document, Revision
from app.modules.projects.models import Project

_FONTS_DIR = Path(__file__).resolve().parent.parent.parent / "assets" / "fonts"

FONT_CANDIDATES = [
    _FONTS_DIR / "DejaVuSans.ttf",
    Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
    Path("C:/Windows/Fonts/arial.ttf"),
]

# Читаемые подписи внутренних статусов документа
STATUS_LABELS = {
    "draft": "Разработка",
    "in_progress": "В работе",
    "review": "На проверке",
    "approval": "На согласовании",
    "approved": "Утверждён",
    "excluded": "Исключён",
}

_MM = 72.0 / 25.4  # мм → пункты


def _resolve_font_path() -> Path:
    for candidate in FONT_CANDIDATES:
        if candidate.is_file():
            return candidate
    raise RuntimeError(
        "Не найден TTF-шрифт с поддержкой кириллицы. "
        "Ожидался app/assets/fonts/DejaVuSans.ttf"
    )


async def collect_title_sheet_fields(
    db: AsyncSession, document_id: int
) -> dict[str, Any]:
    """Собрать поля титульного листа по документу (проект, ревизия, автор).

    Raises:
        ValueError: документ с таким id не найден.
    """
    doc = await db.get(Document, document_id)
    if doc is None:
        raise ValueError(f"Document {document_id} not found")

    project_name = ""
    project_code = ""
    if doc.project_id:
        project = await db.get(Project, doc.project_id)
        if project is not None:
            project_name = project.name or ""
            project_code = project.code or ""

    author_name = ""
    if doc.author_id:
        author = await db.get(User, doc.author_id)
        if author is not None:
            author_name = author.full_name or author.username or author.email or ""

    revision = ""
    result = await db.execute(
        select(Revision.number)
        .where(Revision.document_id == document_id)
        .order_by(Revision.id.desc())
        .limit(1)
    )
    latest = result.scalar_one_or_none()
    if latest:
        revision = latest

    return {
        "number": doc.number or "",
        "name": doc.name or "",
        "doc_type": doc.doc_type or "",
        "status": STATUS_LABELS.get(doc.status or "", doc.status or ""),
        "revision": revision,
        "project_name": project_name,
        "project_code": project_code,
        "author": author_name,
        "created": doc.created_at.strftime("%d.%m.%Y") if doc.created_at else "",
        "planned_ready": (
            doc.planned_ready.strftime("%d.%m.%Y") if doc.planned_ready else ""
        ),
    }


def _fit_text(font: fitz.Font, text: str, size: float, width: float) -> str:
    """Ужать текст до ширины ячейки (с многоточием)."""
    if font.text_length(text, size) <= width - 4:
        return text
    while text and font.text_length(text + "…", size) > width - 4:
        text = text[:-1]
    return text + "…"


def build_title_sheet_bytes(fields: dict[str, Any]) -> bytes:
    """Построить PDF титульного листа A4: рамка, основная надпись, шапка."""
    font = fitz.Font(fontfile=str(_resolve_font_path()))

    doc = fitz.open()
    page = doc.new_page(width=fitz.paper_rect("a4").width,
                        height=fitz.paper_rect("a4").height)
    w, h = page.rect.width, page.rect.height
    tw = fitz.TextWriter(page.rect)

    # Двойная рамка листа (20 / 5 мм от кромки — как в ГОСТ 2.301)
    page.draw_rect(fitz.Rect(20 * _MM, 20 * _MM, w - 20 * _MM, h - 20 * _MM),
                   color=(0, 0, 0), width=1.2)
    page.draw_rect(fitz.Rect(5 * _MM, 5 * _MM, w - 5 * _MM, h - 5 * _MM),
                   color=(0, 0, 0), width=2.0)
    frame_left, frame_bottom = 20 * _MM, h - 20 * _MM

    # Шапка внутри рамки: проект, наименование, обозначение
    project_line = fields["project_name"] or "—"
    if fields["project_code"]:
        project_line = f'{project_line} · шифр {fields["project_code"]}'
    tw.append((frame_left + 12, 45 * _MM), project_line, font=font, fontsize=11)
    name = _fit_text(font, fields["name"] or "—", 22, w - 2 * (frame_left + 12))
    tw.append((frame_left + 12, 58 * _MM), name, font=font, fontsize=22)
    number = _fit_text(font, fields["number"] or "—", 14, w - 2 * (frame_left + 12))
    tw.append((frame_left + 12, 70 * _MM), number, font=font, fontsize=14)

    # Основная надпись 185×55 мм в правом нижнем углу внутри рамки
    stamp_w, stamp_h = 185 * _MM, 55 * _MM
    x0 = frame_left + (w - 40 * _MM) - stamp_w
    y1 = frame_bottom
    y0 = y1 - stamp_h

    # Колонки: подпись | значение | подпись | значение
    col_edges_mm = [0, 40, 120, 150, 185]
    col_x = [x0 + e * _MM for e in col_edges_mm]
    # Строки сверху вниз (мм)
    row_heights_mm = [10, 10, 10, 10, 15]
    row_y = [y0]
    for rh in row_heights_mm:
        row_y.append(row_y[-1] + rh * _MM)

    cells = [
        # (row, col_from, col_to, текст, размер, по центру)
        (0, 0, 1, "Проект", 6, False),
        (0, 1, 4, project_line, 8, False),
        (1, 0, 1, "Документ", 6, False),
        (1, 1, 4, fields["name"] or "—", 8, False),
        (2, 0, 1, "Обозначение", 6, False),
        (2, 1, 3, fields["number"] or "—", 9, False),
        (2, 3, 4, f'Рев. {fields["revision"] or "—"}', 7, False),
        (3, 0, 1, "Статус", 6, False),
        (3, 1, 2, fields["status"] or "—", 7, False),
        (3, 2, 3, "Дата", 6, False),
        (3, 3, 4, fields["created"] or "—", 7, False),
        (4, 0, 1, "Разработал", 6, False),
        (4, 1, 2, fields["author"] or "—", 7, False),
        (4, 2, 3, "План. готовность", 6, False),
        (4, 3, 4, fields["planned_ready"] or "—", 7, False),
    ]

    # Заливка и сетка основной надписи
    page.draw_rect(fitz.Rect(x0, y0, x0 + stamp_w, y1), color=None, fill=(1, 1, 1))
    for cy in row_y:
        page.draw_line(fitz.Point(x0, cy), fitz.Point(x0 + stamp_w, cy),
                       color=(0, 0, 0), width=0.7)
    for cx in col_x:
        page.draw_line(fitz.Point(cx, y0), fitz.Point(cx, y1),
                       color=(0, 0, 0), width=0.7)
    page.draw_rect(fitz.Rect(x0, y0, x0 + stamp_w, y1), color=(0, 0, 0), width=1.0)

    for row, c_from, c_to, text, size, _center in cells:
        cx0, cx1 = col_x[c_from], col_x[c_to]
        cy0, cy1 = row_y[row], row_y[row + 1]
        fitted = _fit_text(font, text, size, cx1 - cx0)
        tw.append((cx0 + 3, cy1 - (cy1 - cy0) / 2 + size / 2 - 1),
                  fitted, font=font, fontsize=size)

    tw.write_text(page)
    return doc.tobytes()
