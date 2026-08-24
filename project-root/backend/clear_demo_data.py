"""Удаление демо-данных, внесённых ранее сид-скриптами.

Работает через app.db.session.AsyncSessionLocal — целевая БД определяется
настройкой DATABASE_URL (PostgreSQL в production, SQLite для разработки):

    cd project-root/backend
    python clear_demo_data.py
    DATABASE_URL=sqlite+aiosqlite:///./iris_dev.db python clear_demo_data.py

Каждый DELETE выполняется в отдельной транзакции: отсутствующая таблица
(например, tasks в старом SQLite) не прерывает остальную очистку.
"""
import asyncio

from sqlalchemy import bindparam, text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

DEMO_TASK_TITLES = [
    "Согласование ТЗ",
    "Разработка чертежей",
    "Получение заключения",
    "Закупка материалов",
    "Проверка геодезии",
    "Утверждение сметы",
]

DEMO_REMARK_TITLES = [
    # seed_demo.py
    "Несоответствие отметок высот",
    "Ошибка в спецификации оборудования",
    "Просрочена поставка материалов",
    "Требуется актуализация чертежей",
    "Замечания по безопасности",
    "Некорректная привязка к сетям",
    "Отклонение от проекта планировки",
    "Проблемы с вентиляцией",
    # seed_minimal.py
    "Несоответствие отметок",
    "Ошибка в спецификации",
    "Неточность размеров",
    # add_sample_data.py
    "Отсутствует привязка колонн",
    "Проверка сечения балок",
]

DEMO_PROJECT_CODES = [
    # seed_demo.py
    "SOL-2024-001",
    "GAL-2024-002",
    "LOG-2023-015",
    "NEB-2024-003",
    "AZS-2024-004",
    # app/db/seed.py
    "ЖС-2024-001",
    "ТЦ-2024-002",
    "ШК-2024-003",
]

DEMO_PROJECT_NAMES = ["Проект Альфа", "Проект Бета"]  # init_db.py

DEMO_DOCUMENT_NUMBERS = ["АР-001", "КР-001", "ОВ-001"]  # app/db/seed.py

DEMO_TENDER_NAMES = [
    "Генеральный подряд на строительство ЖК «Северная Звезда»",
    "Поставка вентиляционного оборудования для ТЦ «Платинум»",
]

DEMO_USER_EMAILS = [
    "engineer@iris.local",
    "manager@iris.local",
    "reviewer@iris.local",
    "test@example.com",
]


def _delete(table: str, where: str, param: str):
    return text(f"DELETE FROM {table} WHERE {where} IN :{param}").bindparams(
        bindparam(param, expanding=True)
    )


async def _run(label: str, statement, params: dict) -> None:
    """Execute one DELETE in its own transaction; skip missing tables."""
    try:
        async with AsyncSessionLocal() as db:
            async with db.begin():
                result = await db.execute(statement, params)
            print(f"  {label}: удалено {result.rowcount}")
    except Exception as exc:  # noqa: BLE001 — пропускаем отсутствующие таблицы
        print(f"  {label}: пропущено ({type(exc).__name__}: {exc})")


async def main() -> None:
    print("Очистка демо-данных...")

    # Демо-проекты: собираем id для каскадной очистки связанных таблиц
    project_ids: list[int] = []
    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                text(
                    "SELECT id FROM projects WHERE code IN :codes OR name IN :names"
                ).bindparams(
                    bindparam("codes", expanding=True),
                    bindparam("names", expanding=True),
                ),
                {"codes": DEMO_PROJECT_CODES, "names": DEMO_PROJECT_NAMES},
            )
            project_ids = [row[0] for row in result.all()]
        print(f"  Найдено демо-проектов: {len(project_ids)}")
    except Exception as exc:  # noqa: BLE001
        print(f"  Поиск демо-проектов: пропущено ({type(exc).__name__}: {exc})")

    await _run(
        "tasks (по названиям)",
        _delete("tasks", "title", "titles"),
        {"titles": DEMO_TASK_TITLES},
    )
    await _run(
        "remarks (по названиям)",
        _delete("remarks", "title", "titles"),
        {"titles": DEMO_REMARK_TITLES},
    )
    await _run(
        "documents (ТЗ/чертежи N.M)",
        text(
            "DELETE FROM documents WHERE title LIKE 'Техническое задание _._' "
            "OR title LIKE 'Рабочие чертежи _._'"
        ),
        {},
    )
    await _run(
        "documents (по номерам)",
        _delete("documents", "number", "numbers"),
        {"numbers": DEMO_DOCUMENT_NUMBERS},
    )
    await _run(
        "tenders",
        _delete("tenders", "name", "names"),
        {"names": DEMO_TENDER_NAMES},
    )

    if project_ids:
        for table in ("tasks", "remarks", "documents", "archive_entries"):
            await _run(
                f"{table} (по проектам)",
                _delete(table, "project_id", "ids"),
                {"ids": project_ids},
            )
        await _run("projects", _delete("projects", "id", "ids"), {"ids": project_ids})

    await _run(
        "users",
        _delete("users", "email", "emails"),
        {"emails": DEMO_USER_EMAILS},
    )

    print("Готово.")


if __name__ == "__main__":
    asyncio.run(main())
