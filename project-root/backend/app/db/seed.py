"""Seed script для наполнения БД демо-данными"""
import asyncio
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

from app.core.config import settings
from app.modules.auth.models import User
from app.modules.projects.models import Project
from app.modules.documents.models import Document
from app.modules.documents.models import DocumentRemark
from app.modules.tenders.models import Tender


async def seed_db():
    """Наполнить БД демо-данными"""
    database_url = settings.DATABASE_URL.replace("sqlite+aiosqlite", "sqlite+aiosqlite")
    engine = create_async_engine(database_url, echo=False)
    AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with AsyncSessionLocal() as session:
        # 1. Создаём пользователей (без явного ID, пусть БД присвоит)
        users_data = [
            {
                "email": "admin@iris.local",
                "username": "admin",
                "hashed_password": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILp92S.0i",  # "admin123"
                "full_name": "Администратор",
                "role": "admin",
                "is_active": True,
                "email_verified": True,
            },
            {
                "email": "engineer@iris.local",
                "username": "engineer",
                "hashed_password": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILp92S.0i",  # "engineer123"
                "full_name": "Инженер Иванов",
                "role": "engineer",
                "is_active": True,
                "email_verified": True,
            },
            {
                "email": "reviewer@iris.local",
                "username": "reviewer",
                "hashed_password": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILp92S.0i",  # "reviewer123"
                "full_name": "Рецензент Петров",
                "role": "reviewer",
                "is_active": True,
                "email_verified": True,
            },
        ]

        user_ids = []
        for user_data in users_data:
            existing = await session.execute(select(User).where(User.email == user_data["email"]))
            if existing.scalar():
                print(f"User exists: {user_data['email']}")
                result = await session.execute(select(User).where(User.email == user_data["email"]))
                user = result.scalar()
                user_ids.append(user.id)
            else:
                user = User(**user_data)
                session.add(user)
                print(f"Created user: {user_data['email']}")
                user_ids.append(user.id)

        await session.commit()

        # 2. Создаём проекты (без явного ID)
        projects_data = [
            {
                "name": "ЖК «Северная Звезда»",
                "code": "ЖС-2024-001",
                "customer_name": "ООО «СтройИнвест»",
                "status": "in_progress",
                "stage": "design",
                "created_by_id": user_ids[0] if len(user_ids) > 0 else 1,
            },
            {
                "name": "ТЦ «Платинум»",
                "code": "ТЦ-2024-002",
                "customer_name": "ООО «Платинум Групп»",
                "status": "in_progress",
                "stage": "design",
                "created_by_id": user_ids[0] if len(user_ids) > 0 else 1,
            },
            {
                "name": "Школа на 1200 мест",
                "code": "ШК-2024-003",
                "customer_name": "Министерство образования МО",
                "status": "planning",
                "stage": "preparation",
                "created_by_id": user_ids[0] if len(user_ids) > 0 else 1,
            },
        ]

        project_ids = []
        for proj_data in projects_data:
            existing = await session.execute(select(Project).where(Project.code == proj_data["code"]))
            if existing.scalar():
                print(f"Project exists: {proj_data['name']}")
                result = await session.execute(select(Project).where(Project.code == proj_data["code"]))
                project = result.scalar()
                project_ids.append(project.id)
            else:
                project = Project(**proj_data)
                session.add(project)
                print(f"Created project: {proj_data['name']}")
                project_ids.append(project.id)

        await session.commit()

        # 3. Создаём документы
        documents_data = [
            {
                "project_id": project_ids[0] if len(project_ids) > 0 else 1,
                "number": "АР-001",
                "name": "Архитектурные решения АР-001",
                "doc_type": "АР",
                "status": "approved",
                "author_id": user_ids[1] if len(user_ids) > 1 else 1,
            },
            {
                "project_id": project_ids[0] if len(project_ids) > 0 else 1,
                "number": "КР-001",
                "name": "Конструктивные решения КР-001",
                "doc_type": "КР",
                "status": "in_review",
                "author_id": user_ids[1] if len(user_ids) > 1 else 1,
            },
            {
                "project_id": project_ids[1] if len(project_ids) > 1 else 2,
                "number": "ОВ-001",
                "name": "ОВ и ВК - Ведомость оборудования",
                "doc_type": "ОВ",
                "status": "draft",
                "author_id": user_ids[1] if len(user_ids) > 1 else 1,
            },
        ]

        for doc_data in documents_data:
            existing = await session.execute(select(Document).where(Document.number == doc_data["number"]))
            if existing.scalar():
                print(f"Document exists: {doc_data['name']}")
            else:
                doc = Document(**doc_data)
                session.add(doc)
                print(f"Created document: {doc_data['name']}")

        await session.commit()

        # 4. Создаём замечания (DocumentRemark)
        remarks_data = [
            {
                "document_id": 1,
                "title": "Несоответствие отметок высот",
                "description": "Отметки высот на чертеже АР-001 не совпадают с разрезом АР-002",
                "remark_type": "customer",
                "severity": "major",
                "status": "new",
                "category": "архитектура",
            },
            {
                "document_id": 2,
                "title": "Отсутствует привязка колонн",
                "description": "На плане этажа КР-001 не указаны оси привязки колонн",
                "remark_type": "internal",
                "severity": "major",
                "status": "acknowledged",
                "category": "конструктив",
            },
            {
                "document_id": 3,
                "title": "Проверка сечения балок",
                "description": "Требуется проверить сечение балок перекрытия на прочность",
                "remark_type": "internal",
                "severity": "minor",
                "status": "resolved_pending",
                "category": "расчёт",
            },
        ]

        for rem_data in remarks_data:
            session.add(DocumentRemark(**rem_data))
            print(f"Created remark: {rem_data['title']}")

        await session.commit()

        # 5. Создаём тендеры
        tenders_data = [
            {
                "name": "Генеральный подряд на строительство ЖК «Северная Звезда»",
                "customer_name": "ООО «СтройИнвест»",
                "project_type": "KM",
                "volume": 50000,
                "volume_unit": "м2",
                "stage": "submitted",
                "nmc": 500000000,
                "status": "approved",
                "created_by_id": user_ids[0] if len(user_ids) > 0 else 1,
            },
            {
                "name": "Поставка вентиляционного оборудования для ТЦ «Платинум»",
                "customer_name": "ООО «Платинум Групп»",
                "project_type": "montazh",
                "volume": 150,
                "volume_unit": "ед.",
                "stage": "auction",
                "nmc": 15000000,
                "status": "review",
                "created_by_id": user_ids[0] if len(user_ids) > 0 else 1,
            },
        ]

        for tender_data in tenders_data:
            session.add(Tender(**tender_data))
            print(f"Created tender: {tender_data['name']}")

        await session.commit()

        print("\n✅ Seeding completed successfully!")


if __name__ == "__main__":
    asyncio.run(seed_db())
