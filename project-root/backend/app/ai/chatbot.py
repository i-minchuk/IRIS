from openai import AsyncOpenAI
from app.core.config import settings


async def chat_with_ai(query: str) -> dict:
    if not settings.OPENAI_API_KEY:
        return {"answer": "AI недоступен без API ключа", "sources": []}

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    response = await client.chat.completions.create(
        model=settings.LLM_MODEL,
        messages=[
            {"role": "system", "content": "Ты ассистент системы ДокПоток IRIS. Отвечай на вопросы пользователя."},
            {"role": "user", "content": query}
        ],
        max_tokens=500,
    )

    return {
        "answer": response.choices[0].message.content,
        "sources": []
    }
