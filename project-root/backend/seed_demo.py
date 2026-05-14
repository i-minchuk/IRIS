import asyncio
from uuid import uuid4
from datetime import datetime, date
from app.db.session import AsyncSessionLocal
from sqlalchemy import text

async def seed_demo():
    async with AsyncSessionLocal() as db:
        # Check existing
        result = await db.execute(text("SELECT COUNT(*) FROM projects"))
        if result.scalar() >= 5:
            print("Demo data already exists, skipping seed")
            return

        # Ensure users exist (admin from seed_minimal + 2 more)
        await db.execute(text("""
            INSERT INTO users (email, hashed_password, full_name, username, role, is_active, is_superuser, email_verified, created_at)
            VALUES 
            ('engineer@iris.local', '$2b$12$TrfP8DPTC9JnwKvnKKepw.anLaPEVRCgBdRYm.OXOHPLRnCw4d.eK', 'Иванов И.И.', 'engineer', 'engineer', true, false, true, now()),
            ('manager@iris.local', '$2b$12$TrfP8DPTC9JnwKvnKKepw.anLaPEVRCgBdRYm.OXOHPLRnCw4d.eK', 'Петрова А.В.', 'manager', 'manager', true, false, true, now())
            ON CONFLICT (email) DO NOTHING
        """))

        # Get admin id
        result = await db.execute(text("SELECT id FROM users WHERE email = 'admin@iris.local'"))
        admin_id = result.scalar()
        result = await db.execute(text("SELECT id FROM users WHERE email = 'engineer@iris.local'"))
        engineer_id = result.scalar() or admin_id
        result = await db.execute(text("SELECT id FROM users WHERE email = 'manager@iris.local'"))
        manager_id = result.scalar() or admin_id

        now = datetime.now()

        # 1. Projects (5)
        projects_data = [
            ("ЖК Солнечный", "SOL-2024-001", "active", "Жилой комплекс в центре", "ООО Солнце", now),
            ("ТЦ Галерея", "GAL-2024-002", "active", "Торговый центр", "ООО Галерея", now),
            ("Склад Логистика", "LOG-2023-015", "completed", "Распределительный центр", "ООО Логистика", now),
            ("БЦ Небоскреб", "NEB-2024-003", "planning", "Бизнес-центр класса А", "ООО Небо", now),
            ("АЗС Сеть-12", "AZS-2024-004", "active", "Автозаправочная станция", "ООО Топливо", now),
        ]
        project_ids = []
        for name, code, status, desc, customer, created in projects_data:
            result = await db.execute(text("""
                INSERT INTO projects (name, code, status, customer_name, created_by_id, created_at, updated_at)
                VALUES (:name, :code, :status, :customer, :cbid, :now, :now)
                RETURNING id
            """), {"name": name, "code": code, "status": status, "customer": customer, "cbid": admin_id, "now": created})
            project_ids.append(result.scalar())

        # 2. Documents (2 per project = 10)
        doc_specs = [
            ("specification", "Техническое задание"),
            ("drawing", "Рабочие чертежи"),
        ]
        document_ids = []
        for i, pid in enumerate(project_ids):
            for j, (dtype, title_base) in enumerate(doc_specs):
                result = await db.execute(text("""
                    INSERT INTO documents (project_id, title, document_type, status, version, created_at, updated_at, created_by_id)
                    VALUES (:pid, :title, :dtype, :status, :version, :now, :now, :cbid)
                    RETURNING id
                """), {
                    "pid": pid, "title": f"{title_base} {i+1}.{j+1}",
                    "dtype": dtype, "status": "approved" if j == 0 else "draft",
                    "version": f"{j+1}.0", "now": now, "cbid": admin_id
                })
                document_ids.append(result.scalar())

        # 3. Remarks (8)
        remark_specs = [
            ("Несоответствие отметок высот", "open", "medium", "other", "internal"),
            ("Ошибка в спецификации оборудования", "new", "high", "other", "internal"),
            ("Просрочена поставка материалов", "in_progress", "high", "other", "external"),
            ("Требуется актуализация чертежей", "new", "medium", "other", "internal"),
            ("Замечания по безопасности", "resolved", "critical", "other", "audit"),
            ("Некорректная привязка к сетям", "in_progress", "medium", "other", "internal"),
            ("Отклонение от проекта планировки", "new", "high", "other", "external"),
            ("Проблемы с вентиляцией", "resolved", "low", "other", "internal"),
        ]
        for i, (title, status, priority, category, source) in enumerate(remark_specs):
            pid = project_ids[i % len(project_ids)]
            await db.execute(text("""
                INSERT INTO remarks (id, project_id, title, description, status, priority, category, source, author_id, related_remark_ids, attachments, history, created_at, updated_at)
                VALUES (gen_random_uuid(), :pid, :title, :desc, :status, :priority, :category, :source, :aid, ARRAY[]::uuid[], '[]'::jsonb, '[]'::jsonb, :now, :now)
            """), {
                "pid": pid, "title": title, "desc": f"Описание: {title}",
                "status": status, "priority": priority, "category": category,
                "source": source, "aid": admin_id, "now": now.isoformat()
            })

        # 4. Tasks (6)
        task_specs = [
            ("Согласование ТЗ", "DOCUMENT", "IN_PROGRESS", "NORMAL", date(2024, 5, 20)),
            ("Разработка чертежей", "DOCUMENT", "NEW", "HIGH", date(2024, 6, 1)),
            ("Получение заключения", "APPROVAL", "DONE", "NORMAL", date(2024, 4, 15)),
            ("Закупка материалов", "PRODUCTION", "IN_PROGRESS", "HIGH", date(2024, 5, 30)),
            ("Проверка геодезии", "REVIEW", "NEW", "NORMAL", date(2024, 6, 10)),
            ("Утверждение сметы", "PLANNING", "DONE", "NORMAL", date(2024, 4, 20)),
        ]
        for i, (title, ttype, status, priority, due) in enumerate(task_specs):
            pid = project_ids[i % len(project_ids)]
            await db.execute(text("""
                INSERT INTO tasks (title, type, status, priority, due_date, creator_id, project_id, percent_complete, created_at, updated_at)
                VALUES (:title, :type, :status, :priority, :due, :cid, :pid, :pc, :now, :now)
            """), {
                "title": title, "type": ttype, "status": status, "priority": priority,
                "due": due, "cid": admin_id, "pid": pid,
                "pc": 0 if status in ("NEW", "IN_PROGRESS") else 100, "now": now
            })

        await db.commit()
        print("Demo data created:")
        print("  Users: 3+")
        print("  Projects: 5")
        print("  Documents: 10")
        print("  Remarks: 8")
        print("  Tasks: 6")

if __name__ == "__main__":
    asyncio.run(seed_demo())
