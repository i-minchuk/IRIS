"""AI document classification module."""
from __future__ import annotations

import json
import logging

from openai import AsyncOpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)

client = AsyncOpenAI(
    api_key=settings.OPENAI_API_KEY,
    base_url=settings.OPENAI_BASE_URL,
)


async def classify_document(content: str) -> dict:
    """Classify an engineering document using OpenAI.

    Returns a dict with keys: type, confidence, keywords.
    Falls back to {"type": "unknown", "confidence": 0} when no API key is set.
    """
    if not settings.OPENAI_API_KEY:
        return {"type": "unknown", "confidence": 0.0, "keywords": []}

    try:
        response = await client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Классифицируй технический документ. "
                        "Возможные типы: КМ, КЖ, КМД, АР, ОВ, ЭОМ, ТХ, ИОС, ПД, РД. "
                        "Ответь JSON: {type, confidence, keywords}"
                    ),
                },
                {
                    "role": "user",
                    "content": content[:4000],  # Первые 4000 символов
                },
            ],
            response_format={"type": "json_object"},
            max_tokens=150,
        )
        result = json.loads(response.choices[0].message.content)
        # Normalize defaults
        return {
            "type": result.get("type", "unknown"),
            "confidence": float(result.get("confidence", 0.0)),
            "keywords": result.get("keywords", []),
        }
    except Exception as exc:
        logger.warning("AI classification failed: %s", exc)
        return {"type": "unknown", "confidence": 0.0, "keywords": []}
