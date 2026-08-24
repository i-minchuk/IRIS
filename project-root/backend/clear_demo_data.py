"""Удаление демо-данных, внесённых ранее сид-скриптами.

Покрывает оба поколения демо-наборов:
- старые скрипты (seed_demo.py, seed_minimal.py, add_sample_data.py, init_db.py,
  app/db/seed.py) — проекты SOL-2024-001 и т.п., пользователи engineer@iris.local;
- актуальный app/db/demo_seed.py — проекты DEMO-xxx, пользователи demo*@iris.local,
  записи с пометкой «(демо)» и archive_entries с source_table='demo_seed'.

Работает через app.core.config.settings.DATABASE_URL (PostgreSQL в production,
SQLite для разработки):

    cd project-root/backend
    python clear_demo_data.py
    DATABASE_URL=sqlite+aiosqlite:///./demo.db python clear_demo_data.py

Каждый DELETE выполняется в отдельной транзакции: отсутствующая таблица
(например, tasks в старом SQLite) не прерывает остальную очистку.

ВНИМАНИЕ: операция необратима. Перед запуском на рабочей БД сделайте бэкап,
например: pg_dump -Fc -f backup.dump <dbname>
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
    # app/db/demo_seed.py
    "DEMO-001",
    "DEMO-002",
    "DEMO-003",
]

DEMO_PROJECT_NAMES = ["Проект Альфа", "Проект Бета"]  # init_db.py

DEMO_DOCUMENT_NUMBERS = ["АР-001", "КР-001", "ОВ-001"]  # app/db/seed.py

DEMO_TENDER_NAMES = [
    "Генеральный подряд на строительство ЖК «Северная Звезда»",
    "Поставка вентиляционного оборудования для ТЦ «Платинум»",
]

DEMO_USER_EMAILS = [
    # старые сиды
    "engineer@iris.local",
    "manager@iris.local",
    "reviewer@iris.local",
    "test@example.com",
    # app/db/demo_seed.py
    "demo@iris.local",
    "demo.director@iris.local",
    "demo.gip@iris.local",
    "demo.manager@iris.local",
    "demo.engineer@iris.local",
    "demo.konstruktor@iris.local",
    "demo.norm@iris.local",
    "demo.site@iris.local",
]

# Маркер актуального демо-сида: «(демо)» в заголовках/названиях
DEMO_TITLE_LIKE = "%(демо)%"
# Заказчик-заглушка demo_seed.py
DEMO_CUSTOMER_LIKE = "%Демонстрация%"

# Таблицы, ссылающиеся на projects.id (первый уровень каскада)
PROJECT_FK_TABLES = [
    "tasks",
    "remarks",
    "documents",
    "archive_entries",
    "archive_constructions",
    "archive_materials",
    "archive_search_index",
    "routes",
    "stages",
    "variables",
    "time_sessions",
    "gamification_events",
    "employee_loads",
    "workflow_instances",
    "srm_contracts",
    "srm_orders",
    "srm_purchase_requests",
    "tenders",
]

# Таблицы, ссылающиеся на users.id (очистка перед удалением демо-пользователей)
USER_FK_COLUMNS = [
    ("archive_entries", "author_id"),
    ("audit_logs", "user_id"),
    ("calendar_events", "user_id"),
    ("combo_achievements", "user_id"),
    ("daily_quests", "user_id"),
    ("documents", "author_id"),
    ("employee_loads", "user_id"),
    ("engineer_metrics", "user_id"),
    ("gamification_badges", "user_id"),
    ("gamification_events", "user_id"),
    ("notifications", "user_id"),
    ("operation_assignments", "user_id"),
    ("operations", "responsible_id"),
    ("remark_comments", "author_id"),
    ("remarks", "assignee_id"),
    ("remarks", "resolved_by"),
    ("revisions", "created_by_id"),
    ("routes", "created_by_id"),
    ("tasks", "creator_id"),
    ("tasks", "assignee_id"),
    ("tenders", "created_by_id"),
    ("tenders", "responsible_id"),
    ("time_sessions", "user_id"),
    ("variable_revisions", "created_by_id"),
    ("work_centers", "manager_id"),
    ("workflow_audit_log", "user_id"),
    ("workflow_comments", "user_id"),
    ("workflow_step_assignees", "user_id"),
]


def _delete(table: str, where: str, param: str):
    return text(f"DELETE FROM {table} WHERE {where} IN :{param}").bindparams(
        bindparam(param, expanding=True)
    )


async def _run(label: str, statement, params: dict | None = None) -> None:
    """Execute one DELETE in its own transaction; skip missing tables."""
    try:
        async with AsyncSessionLocal() as db:
            async with db.begin():
                result = await db.execute(statement, params or {})
            print(f"  {label}: удалено {result.rowcount}")
    except Exception as exc:  # noqa: BLE001 — пропускаем отсутствующие таблицы
        print(f"  {label}: пропущено ({type(exc).__name__}: {exc})")


async def _select_ids(label: str, query: str, params: dict | None = None) -> list:
    """SELECT id ... — вернуть список id, при ошибке вернуть []."""
    params = params or {}
    try:
        stmt = text(query)
        expanding = [
            bindparam(k, expanding=True)
            for k, v in params.items()
            if isinstance(v, (list, tuple))
        ]
        if expanding:
            stmt = stmt.bindparams(*expanding)
        async with AsyncSessionLocal() as db:
            result = await db.execute(stmt, params)
            return [row[0] for row in result.all()]
    except Exception as exc:  # noqa: BLE001
        print(f"  {label}: пропущено ({type(exc).__name__}: {exc})")
        return []


async def main() -> None:
    print("Очистка демо-данных...")

    # Демо-проекты: по известным кодам/именам, по паттерну DEMO-% и по
    # заказчику-заглушке «Демонстрация» — собираем id для каскадной очистки
    project_ids: list = await _select_ids(
        "Поиск демо-проектов",
        "SELECT id FROM projects WHERE code IN :codes OR code LIKE 'DEMO-%' "
        "OR name IN :names OR customer_name LIKE :cust",
        {
            "codes": tuple(DEMO_PROJECT_CODES),
            "names": tuple(DEMO_PROJECT_NAMES),
            "cust": DEMO_CUSTOMER_LIKE,
        },
    )
    print(f"  Найдено демо-проектов: {len(project_ids)}")

    # id связанных сущностей для второго уровня каскада
    doc_ids: list = []
    remark_ids: list = []
    task_ids: list = []
    entry_ids: list = []
    if project_ids:
        doc_ids = await _select_ids(
            "Поиск демо-документов",
            "SELECT id FROM documents WHERE project_id IN :ids",
            {"ids": tuple(project_ids)},
        )
        remark_ids = await _select_ids(
            "Поиск демо-замечаний",
            "SELECT id FROM remarks WHERE project_id IN :ids",
            {"ids": tuple(project_ids)},
        )
        task_ids = await _select_ids(
            "Поиск демо-задач",
            "SELECT id FROM tasks WHERE project_id IN :ids",
            {"ids": tuple(project_ids)},
        )
        entry_ids = await _select_ids(
            "Поиск демо-записей архива",
            "SELECT id FROM archive_entries WHERE project_id IN :ids",
            {"ids": tuple(project_ids)},
        )

    # --- Второй уровень: потомки замечаний / документов / задач / архива ---
    if remark_ids:
        await _run(
            "remark_comments",
            _delete("remark_comments", "remark_id", "ids"),
            {"ids": remark_ids},
        )
        await _run(
            "remark_tag_links",
            _delete("remark_tag_links", "remark_id", "ids"),
            {"ids": remark_ids},
        )
        await _run(
            "workflow_instances (по замечаниям)",
            _delete("workflow_instances", "remark_id", "ids"),
            {"ids": remark_ids},
        )
    if doc_ids:
        await _run(
            "approval_workflows",
            _delete("approval_workflows", "document_id", "ids"),
            {"ids": doc_ids},
        )
        await _run(
            "revisions", _delete("revisions", "document_id", "ids"), {"ids": doc_ids}
        )
        await _run(
            "workflow_instances (по документам)",
            _delete("workflow_instances", "document_id", "ids"),
            {"ids": doc_ids},
        )
        await _run(
            "variables (по документам)",
            _delete("variables", "document_id", "ids"),
            {"ids": doc_ids},
        )
        await _run(
            "time_sessions (по документам)",
            _delete("time_sessions", "document_id", "ids"),
            {"ids": doc_ids},
        )
    if task_ids:
        await _run(
            "time_sessions (по задачам)",
            _delete("time_sessions", "task_id", "ids"),
            {"ids": task_ids},
        )
    if entry_ids:
        for table in (
            "archive_constructions",
            "archive_materials",
            "archive_search_index",
        ):
            await _run(
                f"{table} (по записям архива)",
                _delete(table, "entry_id", "ids"),
                {"ids": entry_ids},
            )

    # --- Первый уровень: строки демо-проектов ---
    if project_ids:
        for table in PROJECT_FK_TABLES:
            await _run(
                f"{table} (по проектам)",
                _delete(table, "project_id", "ids"),
                {"ids": project_ids},
            )

    # --- Маркеры старых сидов (вне демо-проектов) ---
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

    # --- Маркеры актуального demo_seed.py: «(демо)» и source_table ---
    await _run(
        "tasks («(демо)»)",
        text("DELETE FROM tasks WHERE title LIKE :pat"),
        {"pat": DEMO_TITLE_LIKE},
    )
    await _run(
        "remarks («(демо)»)",
        text("DELETE FROM remarks WHERE title LIKE :pat"),
        {"pat": DEMO_TITLE_LIKE},
    )
    await _run(
        "documents («(демо)»)",
        text("DELETE FROM documents WHERE name LIKE :pat OR number LIKE 'DEMO-%'"),
        {"pat": DEMO_TITLE_LIKE},
    )
    await _run(
        "tenders («(демо)»)",
        text("DELETE FROM tenders WHERE name LIKE :pat OR customer_name LIKE :cust"),
        {"pat": DEMO_TITLE_LIKE, "cust": DEMO_CUSTOMER_LIKE},
    )
    await _run(
        "archive_entries (source_table='demo_seed')",
        text(
            "DELETE FROM archive_entries WHERE source_table = 'demo_seed' "
            "OR title LIKE :pat"
        ),
        {"pat": DEMO_TITLE_LIKE},
    )

    # --- Демо-проекты ---
    if project_ids:
        await _run("projects", _delete("projects", "id", "ids"), {"ids": project_ids})

    # --- Демо-пользователи: сначала их строки в зависимых таблицах ---
    user_ids: list = await _select_ids(
        "Поиск демо-пользователей",
        "SELECT id FROM users WHERE email IN :emails",
        {"emails": tuple(DEMO_USER_EMAILS)},
    )
    if user_ids:
        for table, column in USER_FK_COLUMNS:
            await _run(
                f"{table} (по демо-пользователям)",
                _delete(table, column, "ids"),
                {"ids": user_ids},
            )
        await _run("users", _delete("users", "id", "ids"), {"ids": user_ids})

    print("Готово.")


if __name__ == "__main__":
    asyncio.run(main())
