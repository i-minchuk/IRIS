"""AI recommendations for tasks."""
from openai import AsyncOpenAI
from app.core.config import settings
import json

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


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

    response = await client.chat.completions.create(
        model=settings.LLM_MODEL,
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        max_tokens=300,
    )
    data = json.loads(response.choices[0].message.content)
    return data.get("recommendations", [])
