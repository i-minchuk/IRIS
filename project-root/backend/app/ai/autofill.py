from openai import AsyncOpenAI
from app.core.config import settings
import json

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


async def suggest_document_fields(template_type: str, project_name: str) -> dict:
    if not settings.OPENAI_API_KEY:
        return {"code": "", "name": "", "discipline": ""}

    prompt = f"Предложи поля для документа типа {template_type} в проекте {project_name}. Ответь JSON: {{code, name, discipline}}"

    response = await client.chat.completions.create(
        model=settings.LLM_MODEL,
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        max_tokens=200,
    )

    return json.loads(response.choices[0].message.content)
