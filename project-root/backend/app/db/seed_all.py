#!/usr/bin/env python3
"""Universal seed script for ДокПоток IRIS.
Creates a full set of test data for any DB (SQLite/PostgreSQL).
Usage: python -m app.db.seed_all
"""
import asyncio
import uuid
from datetime import datetime, timedelta

from sqlalchemy import text

from app.db.session import AsyncSessionLocal
from app.core.config import settings
from app.core.security import get_password_hash


async def seed_all():
    async with AsyncSessionLocal() as db:
        print(f"🌱 Seeding database: {settings.DATABASE_URL[:50]}...")

        now = datetime.utcnow()
        admin_hash = get_password_hash("admin123")
        user_hash = get_password_hash("password123")

        # =====================================================================
        # 1. USERS
        # =====================================================================
        print("\n👤 Creating users...")
        users_data = [
            ("admin@iris.local", "admin", "Администратор", "admin", True),
            ("engineer@iris.local", "engineer", "Инженер Иванов", "engineer", True),
            ("manager@iris.local", "manager", "Менеджер Петрова", "manager", True),
        ]
        user_ids = []
        for email, username, full_name, role, is_active in users_data:
            existing = await db.execute(
                text("SELECT id FROM users WHERE email = :email"),
                {"email": email},
            )
            row = existing.fetchone()
            if row:
                user_ids.append(row[0])
                print(f"  ✅ User exists: {email}")
                continue

            result = await db.execute(
                text("""
                    INSERT INTO users (email, username, hashed_password, full_name, role, is_active, is_superuser, email_verified, created_at)
                    VALUES (:email, :username, :hash, :name, :role, :active, :super, :verified, :now)
                    RETURNING id
                """),
                {
                    "email": email,
                    "username": username,
                    "hash": admin_hash if role == "admin" else user_hash,
                    "name": full_name,
                    "role": role,
                    "active": is_active,
                    "super": role == "admin",
                    "verified": True,
                    "now": now,
                },
            )
            uid = result.scalar()
            user_ids.append(uid)
            print(f"  ✅ Created: {email}")

        await db.commit()
        print(f"  Users in DB: {len(user_ids)}")

        # =====================================================================
        # 2. PROJECTS
        # =====================================================================
        print("\n📊 Creating projects...")
        projects_data = [
            ("ЖК Солнечный", "SOL-2024-001", "active", "ООО СтройИнвест", "design"),
            ("ТЦ Галерея", "GAL-2024-002", "planning", "ООО Галерея Групп", "eskiz"),
            ("Склад Логистика", "LOG-2023-015", "completed", "ООО Логистика", "completed"),
        ]
        project_ids = []
        for name, code, status, customer, stage in projects_data:
            existing = await db.execute(
                text("SELECT id FROM projects WHERE code = :code"),
                {"code": code},
            )
            row = existing.fetchone()
            if row:
                project_ids.append(row[0])
                print(f"  ✅ Project exists: {code}")
                continue

            result = await db.execute(
                text("""
                    INSERT INTO projects (name, code, status, customer_name, created_by_id, stage, created_at, updated_at)
                    VALUES (:name, :code, :status, :customer, :created_by, :stage, :now, :now)
                    RETURNING id
                """),
                {
                    "name": name,
                    "code": code,
                    "status": status,
                    "customer": customer,
                    "created_by": user_ids[0],
                    "stage": stage,
                    "now": now,
                },
            )
            pid = result.scalar()
            project_ids.append(pid)
            print(f"  ✅ Created: {code}")

        await db.commit()
        print(f"  Projects in DB: {len(project_ids)}")

        # =====================================================================
        # 3. REMARKS
        # =====================================================================
        print("\n📝 Creating remarks...")
        if project_ids:
            from app.modules.remarks.models import Remark
            remarks_data = [
                (project_ids[0], "Несоответствие отметок высот", "Отметки на чертежах не совпадают с разрезом", "in_progress", "high", "design_error", "internal"),
                (project_ids[0], "Ошибка в спецификации", "Неверно указан класс бетона", "new", "critical", "discrepancy", "internal"),
                (project_ids[0], "Просрочена поставка материалов", "Арматура не поступила вовремя", "in_progress", "high", "other", "customer"),
                (project_ids[1] if len(project_ids) > 1 else project_ids[0], "Требуется актуализация чертежей", "Чертежи КР не соответствуют последним изменениям", "new", "medium", "incompleteness", "internal"),
                (project_ids[1] if len(project_ids) > 1 else project_ids[0], "Замечания по безопасности", "Отсутствует ограждение на стройплощадке", "resolved", "critical", "norm_violation", "audit"),
            ]
            created_count = 0
            for pid, title, desc, status, priority, category, source in remarks_data:
                existing = await db.execute(
                    text("SELECT id FROM remarks WHERE title = :title AND project_id = :pid"),
                    {"title": title, "pid": pid},
                )
                if existing.fetchone():
                    print(f"  ✅ Remark exists: {title}")
                    continue

                try:
                    remark = Remark(
                        project_id=pid,
                        title=title,
                        description=desc,
                        status=status,
                        priority=priority,
                        category=category,
                        source=source,
                        author_id=user_ids[1] if len(user_ids) > 1 else user_ids[0],
                    )
                    db.add(remark)
                    await db.flush()
                    created_count += 1
                    print(f"  ✅ Created remark: {title}")
                except Exception as e:
                    print(f"  ⚠️ Remark skipped ({e})")
                    await db.rollback()
                    # Re-create session after rollback
                    break
            
            if created_count > 0:
                await db.commit()
                print(f"  Committed {created_count} remarks")

        # =====================================================================
        # 4. ARCHIVE ENTRIES (if table exists)
        # =====================================================================
        print("\n📦 Creating archive entries...")
        try:
            from uuid import uuid4 as uuid_gen

            # Check if archive_entries table exists
            # Use information_schema for PostgreSQL, sqlite_master for SQLite
            table_exists = False
            if "postgresql" in settings.DATABASE_URL:
                result = await db.execute(
                    text("SELECT 1 FROM information_schema.tables WHERE table_name = 'archive_entries'")
                )
                table_exists = result.fetchone() is not None
            else:
                result = await db.execute(
                    text("SELECT name FROM sqlite_master WHERE type='table' AND name='archive_entries'")
                )
                table_exists = result.fetchone() is not None

            if not table_exists:
                print("  ⚠️ archive_entries table does not exist, skipping...")
            else:
                archive_data = [
                    (project_ids[0], "milestone", "projects", "Старт проекта", now - timedelta(days=30)),
                    (project_ids[0], "document", "documents", "Утверждение ТЗ", now - timedelta(days=15)),
                    (project_ids[0], "remark", "remarks", "Выявлено замечание по безопасности", now - timedelta(days=7)),
                ]
                for pid, entry_type, source_table, title, occurred_at in archive_data:
                    existing = await db.execute(
                        text("SELECT id FROM archive_entries WHERE title = :title AND project_id = :pid"),
                        {"title": title, "pid": pid},
                    )
                    if existing.fetchone():
                        print(f"  ✅ Archive entry exists: {title}")
                        continue

                    await db.execute(
                        text("""
                            INSERT INTO archive_entries (id, project_id, entry_type, source_table, source_id, title, occurred_at, created_at, updated_at)
                            VALUES (:id, :pid, :etype, :src_table, :src_id, :title, :occured, :now, :now)
                        """),
                        {
                            "id": str(uuid_gen()),
                            "pid": pid,
                            "etype": entry_type,
                            "src_table": source_table,
                            "src_id": str(uuid_gen()),
                            "title": title,
                            "occured": occurred_at,
                            "now": now,
                        },
                    )
                    print(f"  ✅ Created archive: {title}")
                await db.commit()
        except Exception as e:
            print(f"  ⚠️ Archive seed skipped: {e}")

        # =====================================================================
        # SUMMARY
        # =====================================================================
        print("\n" + "=" * 50)
        print("✅ Seed completed successfully!")
        print("=" * 50)

        # Count and report
        for table in ["users", "projects", "remarks", "archive_entries"]:
            try:
                result = await db.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = result.scalar()
                print(f"  {table}: {count}")
            except Exception:
                pass

        print()
        print("  🔑 Admin login:  admin@iris.local / admin123")
        print("  🔑 Engineer:     engineer@iris.local / password123")
        print("  🔑 Manager:      manager@iris.local / password123")


if __name__ == "__main__":
    asyncio.run(seed_all())