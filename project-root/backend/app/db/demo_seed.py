"""Фиксированный набор вымышленных демо-данных.

Загружается автоматически при старте приложения с MODE=demo
(features.demo_data_seed: true в config/config.demo.yaml).
Все данные заведомо вымышленные (ООО «Демонстрация», проекты DEMO-xxx).

Набор покрывает все виджеты дашборда и архива: пользователи с разными
ролями, проекты, документы (в т.ч. просроченные), замечания, задачи
(в т.ч. просроченные), тендеры по всем стадиям воронки, сессии учёта
времени за последние 30 дней, события геймификации, архивные записи,
материалы и конструкции с датами, разнесёнными по месяцам и годам.

Идемпотентно: если пользователь demo@iris.local уже существует, сид пропускается.
Используются только ORM-модели — работает и на SQLite, и на PostgreSQL.

Защита от утечки в прод: seed_demo_data() перед любой записью проверяет,
что приложение работает в MODE=demo с включённым флагом demo_data_seed
и что целевая БД — демо-база (имя БД содержит «demo»: demo.db, iris_demo…).
При любом несоответствии выбрасывается RuntimeError до первого INSERT.
"""
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from sqlalchemy import select

from app.core.config import settings
from app.core.mode import get_mode, get_mode_config
from app.core.security import get_password_hash
from app.db.session import AsyncSessionLocal
from app.models.archive import ArchiveConstruction, ArchiveEntry, ArchiveMaterial
from app.modules.auth.models import User
from app.modules.documents.models import Document
from app.modules.gamification.models import GamificationEvent
from app.modules.projects.models import Project
from app.modules.remarks.models import Remark
from app.modules.tasks.models import Task
from app.modules.tenders.models import Tender
from app.modules.time_tracking.models import TimeSession

DEMO_EMAIL = "demo@iris.local"
DEMO_PASSWORD = "demo1234"

_CUSTOMER = "ООО «Демонстрация»"


def _days_ago(now: datetime, days: float, hour: int = 9) -> datetime:
    """now минус N дней, время приведено к hour:00 UTC."""
    return (now - timedelta(days=days)).replace(
        hour=hour, minute=0, second=0, microsecond=0
    )


def _assert_demo_environment() -> None:
    """Гарантировать, что сид выполняется только в демо-окружении.

    Тройная проверка до первого INSERT:
    1. MODE=demo;
    2. features.demo_data_seed включён в config.<mode>.yaml;
    3. имя целевой БД содержит «demo» (demo.db, iris_demo, …) —
       демо-данные физически не могут попасть в рабочую БД.
    """
    if get_mode() != "demo":
        raise RuntimeError(
            "seed_demo_data() запрещён вне MODE=demo — "
            "демо-данные не должны попадать в рабочую БД."
        )
    if not get_mode_config().features.demo_data_seed:
        raise RuntimeError(
            "seed_demo_data() запрещён при выключенном features.demo_data_seed."
        )
    db_name = settings.DATABASE_URL.rsplit("/", 1)[-1].split("?")[0].lower()
    if "demo" not in db_name:
        raise RuntimeError(
            f"Отказ: демо-сид нацелен на НЕ демо-БД ({db_name!r}). "
            "В MODE=demo DATABASE_URL должен указывать на отдельную базу "
            "с «demo» в имени (например, sqlite+aiosqlite:///./demo.db "
            "или postgresql+asyncpg://…/iris_demo)."
        )


async def seed_demo_data() -> None:
    """Создать вымышленный набор данных, если демо-пользователя ещё нет.

    На пустой БД (свежий SQLite-файл) предварительно создаёт схему
    через metadata.create_all — цепочка Alembic-миграций для чистой
    SQLite исторически сломана, в prod используется PostgreSQL + Alembic.
    """
    _assert_demo_environment()

    from app.db.base import Base
    from app.db.session import primary_engine
    import app.models  # noqa: F401 — регистрация всех моделей

    async with primary_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        existing = await session.execute(select(User).where(User.email == DEMO_EMAIL))
        if existing.scalar():
            return  # демо-данные уже посеяны

        now = datetime.now(timezone.utc)
        password_hash = get_password_hash(DEMO_PASSWORD)

        # --- Пользователи (вымышленные, 8 ролей) ---
        users_spec = [
            # email, username, full_name, role, is_superuser
            (DEMO_EMAIL, "demo", "Демидов Демид Демидович", "admin", True),
            ("demo.director@iris.local", "demo_director", "Директоров Дмитрий Павлович", "director", False),
            ("demo.gip@iris.local", "demo_gip", "Гипова Галина Петровна", "gip", False),
            ("demo.manager@iris.local", "demo_manager", "Менеджерова Марина Сергеевна", "manager", False),
            ("demo.engineer@iris.local", "demo_engineer", "Инженеров Иван Иванович", "engineer", False),
            ("demo.konstruktor@iris.local", "demo_konstruktor", "Конструкторова Ксения Олеговна", "engineer", False),
            ("demo.norm@iris.local", "demo_norm", "Нормоконтролёва Надежда Викторовна", "norm_controller", False),
            ("demo.site@iris.local", "demo_site", "Строителев Степан Андреевич", "site_manager", False),
        ]
        users = {}
        for email, username, full_name, role, is_superuser in users_spec:
            user = User(
                email=email,
                username=username,
                hashed_password=password_hash,
                full_name=full_name,
                role=role,
                is_superuser=is_superuser,
                is_active=True,
                email_verified=True,
            )
            session.add(user)
            users[username] = user
        await session.flush()

        admin = users["demo"]
        gip = users["demo_gip"]
        manager = users["demo_manager"]
        engineer = users["demo_engineer"]
        konstruktor = users["demo_konstruktor"]
        norm = users["demo_norm"]
        site = users["demo_site"]

        # --- Проекты ---
        projects = [
            Project(
                name="БЦ «Пример»",
                code="DEMO-001",
                customer_name=_CUSTOMER,
                status="active",
                stage="Рабочий",
                planned_finish=now + timedelta(days=120),
                manager_id=manager.id,
                created_by_id=admin.id,
                created_at=_days_ago(now, 200),
            ),
            Project(
                name="Склад «Образец»",
                code="DEMO-002",
                customer_name=_CUSTOMER,
                status="active",
                stage="Рабочий",
                planned_finish=now + timedelta(days=60),
                manager_id=manager.id,
                created_by_id=admin.id,
                created_at=_days_ago(now, 120),
            ),
            Project(
                name="ЖК «Тестовый»",
                code="DEMO-003",
                customer_name=_CUSTOMER,
                status="planning",
                stage="Эскизный",
                planned_finish=now + timedelta(days=300),
                manager_id=gip.id,
                created_by_id=manager.id,
                created_at=_days_ago(now, 30),
            ),
        ]
        session.add_all(projects)
        await session.flush()

        # --- Документы (часть просрочена: старше 30 дней и не approved) ---
        documents_spec = [
            # project_idx, number, name, doc_type, status, author, created_days_ago
            (0, "DEMO-AR-001", "Архитектурные решения (демо)", "АР", "approved", engineer, 150),
            (0, "DEMO-KR-001", "Конструктивные решения (демо)", "КР", "in_review", engineer, 45),
            (0, "DEMO-KM-002", "КМ. Каркас 2-й очереди (демо)", "КМ", "in_review", konstruktor, 12),
            (0, "DEMO-OV-001", "Ведомость оборудования (демо)", "ОВ", "approved", konstruktor, 90),
            (1, "DEMO-KR-101", "Конструкции склада (демо)", "КР", "draft", engineer, 62),
            (1, "DEMO-AR-101", "Фасады склада (демо)", "АР", "approved", gip, 100),
            (2, "DEMO-PD-201", "Эскиз ЖК (демо)", "ПД", "draft", gip, 20),
        ]
        documents = []
        for p_idx, number, name, doc_type, status, author, age in documents_spec:
            doc = Document(
                project_id=projects[p_idx].id,
                number=number,
                name=name,
                doc_type=doc_type,
                status=status,
                author_id=author.id,
                created_at=_days_ago(now, age),
            )
            session.add(doc)
            documents.append(doc)
        await session.flush()

        # --- Замечания (открытые старше 3 дней попадают в сводку) ---
        remarks_spec = [
            # project_idx, doc_idx|None, title, status, priority, author, assignee|None, created_days_ago
            (0, 1, "Уточнить отметки высот (демо)", "new", "critical", manager, engineer, 10),
            (0, 1, "Ошибка в спецификации оборудования (демо)", "in_progress", "high", admin, konstruktor, 8),
            (0, 2, "Просрочена поставка материалов (демо)", "new", "medium", site, manager, 5),
            (0, None, "Требуется актуализация чертежей (демо)", "in_progress", "medium", norm, engineer, 4),
            (1, 4, "Некорректная привязка к сетям (демо)", "new", "high", gip, engineer, 6),
            (1, 5, "Отклонение от проекта планировки (демо)", "resolved", "low", manager, engineer, 15),
            (2, 6, "Нет привязки к осям (демо)", "closed", "medium", gip, None, 21),
        ]
        for p_idx, d_idx, title, status, priority, author, assignee, age in remarks_spec:
            remark = Remark(
                project_id=projects[p_idx].id,
                document_id=documents[d_idx].id if d_idx is not None else None,
                title=title,
                description=f"Вымышленное замечание для демонстрации ({title.lower()}).",
                status=status,
                priority=priority,
                author_id=author.id,
                assignee_id=assignee.id if assignee else None,
                created_at=_days_ago(now, age),
            )
            if status in ("resolved", "closed"):
                remark.resolved_by = (assignee or engineer).id
                remark.resolved_at = _days_ago(now, max(age - 3, 1))
            session.add(remark)

        # --- Задачи (просроченные и открытые — сводка + загрузка отделов) ---
        tasks_spec = [
            # title, type, status, priority, due_in_days (отриц. = просрочено), creator, assignee, project_idx
            ("Согласовать КР с заказчиком (демо)", "approval", "in_progress", "high", 3, manager, engineer, 0),
            ("Внести правки в ведомость (демо)", "document", "new", "normal", 7, admin, engineer, 1),
            ("Подготовить презентацию проекта (демо)", "production", "in_progress", "normal", -1, admin, manager, 2),
            ("Устранить замечание по отметкам высот (демо)", "document", "in_progress", "high", -4, manager, engineer, 0),
            ("Согласование ТЗ с заказчиком (демо)", "approval", "new", "high", -12, gip, manager, 2),
            ("Разработка чертежей КМ 2-й очереди (демо)", "production", "in_progress", "normal", -6, gip, konstruktor, 0),
            ("Закупка материалов для склада (демо)", "production", "new", "normal", -2, manager, site, 1),
            ("Проверка геодезической разбивки (демо)", "review", "new", "normal", 5, site, gip, 1),
            ("Нормоконтроль раздела КР (демо)", "review", "review", "normal", 2, manager, norm, 0),
            ("Нормоконтроль раздела АР (демо)", "review", "done", "normal", -5, manager, norm, 0),
            ("Выпуск ведомости металла (демо)", "document", "done", "normal", -8, gip, konstruktor, 0),
        ]
        for title, t_type, status, priority, due_in, creator, assignee, p_idx in tasks_spec:
            task = Task(
                title=title,
                type=t_type,
                status=status,
                priority=priority,
                due_date=now + timedelta(days=due_in),
                creator_id=creator.id,
                assignee_id=assignee.id,
                project_id=projects[p_idx].id,
            )
            if status == "done":
                task.completed_at = now + timedelta(days=due_in - 1)
                task.percent_complete = 100
            session.add(task)

        # --- Тендеры (все стадии воронки + суммы + сроки) ---
        tenders_spec = [
            # name, type, status, stage, nmc, our_price, margin, calc_cost, deadline_in_days, created_days_ago, loss_reason
            ("КМ для БЦ «Пример» (демо)", "KM", "draft", "preparation", 45_000_000, None, None, None, 14, 5, None),
            ("КМД для паркинга «Пример» (демо)", "KMD", "draft", "preparation", 12_000_000, None, None, None, 1.3, 2, None),
            ("ПД для школы на 1200 мест (демо)", "PD", "review", "qualification", 20_000_000, None, None, None, 7, 3, None),
            ("Монтаж вентиляции склада «Образец» (демо)", "montazh", "approved", "approval", 8_500_000, 7_900_000, 12.0, 7_000_000, 5, 20, None),
            ("КМ для ТЦ «Меридиан» (демо)", "KM", "sent", "submitted", 34_000_000, 32_000_000, 11.0, 30_000_000, 3, 40, None),
            ("КМ для ЖК «Северный» (демо)", "KM", "won", "won", 40_000_000, 38_000_000, 14.0, 33_000_000, None, 270, None),
            ("ПД для логопарка «Образец» (демо)", "PD", "won", "won", 16_000_000, 15_000_000, 18.0, 12_500_000, None, 150, None),
            ("Монтаж КМ завода «Пример» (демо)", "montazh", "won", "won", 24_000_000, 22_000_000, 10.0, 20_000_000, None, 60, None),
            ("КМД для мостового перехода (демо)", "KMD", "lost", "lost", 58_000_000, 55_000_000, 8.0, 51_000_000, None, 120, "Цена выше конкурента"),
            ("ПД для гостиницы «Тестовая» (демо)", "PD", "cancelled", "waiting", 9_000_000, None, None, None, None, 210, None),
        ]
        for name, p_type, status, stage, nmc, our_price, margin, calc_cost, dl_in, age, loss in tenders_spec:
            tender = Tender(
                name=name,
                customer_name=_CUSTOMER,
                project_type=p_type,
                status=status,
                stage=stage,
                nmc=nmc,
                our_price=our_price,
                margin_pct=margin,
                calculated_cost=calc_cost,
                deadline=(now + timedelta(days=dl_in)) if dl_in is not None else None,
                loss_reason=loss,
                responsible_id=manager.id,
                created_by_id=admin.id,
                created_at=_days_ago(now, age),
            )
            session.add(tender)

        # --- Сессии учёта времени (последние 28 дней, по будням) ---
        session_users = [engineer, konstruktor, gip, manager, norm, site]
        eff_by_user = {engineer: 0.88, konstruktor: 0.82, gip: 0.76, manager: 0.71, norm: 0.92, site: 0.68}
        for day_offset in range(27, -1, -1):
            day_start = _days_ago(now, day_offset, hour=9)
            if day_start.weekday() >= 5:
                continue  # выходные — без сессий
            for user in session_users:
                base_eff = eff_by_user[user]
                # небольшой разброс эффективности по дням
                eff = min(0.98, max(0.5, base_eff + ((day_offset % 5) - 2) * 0.03))
                total = 7 * 3600
                active = int(total * eff)
                ts = TimeSession(
                    user_id=user.id,
                    project_id=projects[day_offset % 3].id,
                    started_at=_days_ago(now, day_offset, hour=9),
                    ended_at=_days_ago(now, day_offset, hour=9) + timedelta(seconds=total),
                    total_duration=total,
                    active_time=active,
                    idle_time=total - active,
                    efficiency_score=round(eff, 2),
                    edit_count=(day_offset % 7) + 2,
                    revisions_created=1 if day_offset % 9 == 0 else 0,
                    remarks_created=1 if day_offset % 6 == 0 else 0,
                    remarks_resolved=1 if day_offset % 4 == 0 else 0,
                )
                session.add(ts)

        # --- Геймификация (баллы за утверждение документов + лидаборд) ---
        points_by_user = {engineer: 45, konstruktor: 38, gip: 30, manager: 26, norm: 34, site: 18}
        for i, (user, pts) in enumerate(points_by_user.items()):
            for j in range(3):
                session.add(
                    GamificationEvent(
                        user_id=user.id,
                        project_id=projects[j % 3].id,
                        event_type="document_approved",
                        points_delta=pts // 3,
                        xp_delta=pts // 3 * 2,
                        comment="Утверждение документа (демо)",
                        created_at=_days_ago(now, 5 + i + j * 7),
                    )
                )

        # --- Архив: записи, материалы, конструкции ---
        # occurred_at разнесены по месяцам 2024–2026 для графиков статистики
        entries_spec = [
            # project_idx, entry_type, title, occurred_days_ago
            (0, "material", "Поставка бетона C30/37 (демо)", 640),
            (0, "material", "Поставка арматуры A500C (демо)", 420),
            (0, "construction", "Монтаж колонн К1 (демо)", 300),
            (0, "document", "Выпуск КМ 1-й очереди (демо)", 240),
            (0, "material", "Поставка сэндвич-панелей (демо)", 180),
            (0, "construction", "Монтаж балок Б1 (демо)", 120),
            (0, "document", "Исполнительная схема фундаментов (демо)", 75),
            (0, "meeting", "Строительное совещание №14 (демо)", 30),
            (0, "document", "Выпуск КМ 2-й очереди (демо)", 12),
            (0, "construction", "Монтаж ферм Ф1 (демо)", 5),
            (1, "material", "Поставка металлопроката (демо)", 500),
            (1, "construction", "Устройство фундаментной плиты (демо)", 380),
            (1, "document", "Исполнительная документация (демо)", 200),
            (1, "material", "Поставка кровельного профиля (демо)", 150),
            (1, "construction", "Монтаж каркаса склада (демо)", 90),
            (1, "document", "Акты скрытых работ (демо)", 40),
            (1, "material", "Поставка вентоборудования (демо)", 20),
            (1, "meeting", "Планёрка с заказчиком (демо)", 7),
            (2, "document", "Эскизное предложение (демо)", 25),
            (2, "meeting", "Совещание по концепции (демо)", 18),
            (2, "material", "Пробный бетон (демо)", 10),
            (2, "document", "Градостроительный план (демо)", 3),
        ]
        entries = []
        for p_idx, entry_type, title, age in entries_spec:
            entry = ArchiveEntry(
                project_id=projects[p_idx].id,
                entry_type=entry_type,
                source_table="demo_seed",
                source_id=uuid4(),
                title=title,
                description=f"Вымышленная архивная запись: {title.lower()}.",
                author_id=engineer.id,
                occurred_at=_days_ago(now, age, hour=12),
                tags=["демо"],
            )
            session.add(entry)
            entries.append((entry, p_idx))
        await session.flush()

        materials_spec = [
            # project_idx, material_type, name, spec, manufacturer, qty, unit, entry_idx|None
            (0, "concrete", "Бетон C30/37 (демо)", "ГОСТ 31108", "Завод «Пример-Бетон»", 850, "м³", 0),
            (0, "rebar", "Арматура A500C Ø12 (демо)", "ГОСТ 34028", "Металлобаза «Образец»", 42, "т", 1),
            (0, "panels", "Сэндвич-панели 100мм (демо)", "ТУ 5284", "ПанельСтрой", 1200, "м²", 4),
            (0, "metal", "Двутавр 30Б1 (демо)", "ГОСТ 26020", "Металлобаза «Образец»", 18, "т", None),
            (1, "metal", "Металлопрокат сортовой (демо)", "ГОСТ 535", "Металлобаза «Образец»", 60, "т", 10),
            (1, "roof", "Профлист НС44 (демо)", "ТУ 1122", "КровляПро", 2400, "м²", 13),
            (1, "vent", "Вентустановка ВЦ-4 (демо)", "Паспорт ВЦ-4", "ВентМаш", 6, "шт.", 16),
            (2, "concrete", "Пробный бетон B25 (демо)", "ГОСТ 31108", "Завод «Пример-Бетон»", 12, "м³", 20),
        ]
        for p_idx, m_type, name, spec, manufacturer, qty, unit, e_idx in materials_spec:
            session.add(
                ArchiveMaterial(
                    project_id=projects[p_idx].id,
                    material_type=m_type,
                    name=name,
                    specification=spec,
                    manufacturer=manufacturer,
                    quantity=qty,
                    unit=unit,
                    entry_id=entries[e_idx][0].id if e_idx is not None else None,
                )
            )

        constructions_spec = [
            # project_idx, name, type, designation, location, status, entry_idx|None
            (0, "Колонны К1 (демо)", "columns", "К1-1…К1-24", "Оси 1-6/А-Г", "installed", 2),
            (0, "Балки Б1 (демо)", "beams", "Б1-1…Б1-18", "Отм. +6.600", "installed", 5),
            (0, "Фермы Ф1 (демо)", "trusses", "Ф1-1…Ф1-12", "Пролёт А-Б", "tested", 9),
            (1, "Фундаментная плита (демо)", "foundation", "ФП-1", "Вся пятно застройки", "accepted", 11),
            (1, "Каркас склада (демо)", "frame", "КС-1", "Секции 1-4", "installed", 14),
            (2, "Сваи С80.30 (демо)", "piles", "С-1…С-96", "Поле 1", "planned", None),
        ]
        for p_idx, name, c_type, designation, location, status, e_idx in constructions_spec:
            session.add(
                ArchiveConstruction(
                    project_id=projects[p_idx].id,
                    name=name,
                    construction_type=c_type,
                    designation=designation,
                    location=location,
                    status=status,
                    entry_id=entries[e_idx][0].id if e_idx is not None else None,
                )
            )

        await session.commit()
