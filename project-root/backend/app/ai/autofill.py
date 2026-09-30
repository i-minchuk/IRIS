from app.core.ai_key import get_ai_client_from_settings, supports_json_response_format
from app.core.config import settings
import json


async def suggest_document_fields(template_type: str, project_name: str) -> dict:
    if not settings.OPENAI_API_KEY:
        return {"code": "", "name": "", "discipline": ""}

    prompt = f"Предложи поля для документа типа {template_type} в проекте {project_name}. Ответь JSON: {{code, name, discipline}}"

    client = await get_ai_client_from_settings()
    request_kwargs = {
        "model": settings.LLM_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 200,
    }
    if supports_json_response_format():
        request_kwargs["response_format"] = {"type": "json_object"}
    response = await client.chat.completions.create(**request_kwargs)

    return json.loads(response.choices[0].message.content)
