"""AI recommendations for tasks."""
from app.core.ai_key import get_ai_client_from_settings, supports_json_response_format
from app.core.config import settings
import json


async def get_task_recommendations(user_id: int, db) -> list:
    if not settings.OPENAI_API_KEY:
        return []

    # Получить задачи из БД
    from app.modules.tasks.models import Task
    from sqlalchemy import select

    result = await db.execute(select(Task).where(Task.assignee_id == user_id).limit(10))
    tasks = result.scalars().all()

    if not tasks:
        return []

    prompt = f"Пользователь имеет {len(tasks)} задач. Рекомендуй 3 приоритетные. Ответь JSON: [{{'task_id', 'reason'}}]"

    client = await get_ai_client_from_settings()
    request_kwargs = {
        "model": settings.LLM_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 300,
    }
    if supports_json_response_format():
        request_kwargs["response_format"] = {"type": "json_object"}
    response = await client.chat.completions.create(**request_kwargs)
    data = json.loads(response.choices[0].message.content)
    return data.get("recommendations", [])
