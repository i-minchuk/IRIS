import asyncio
from uuid import uuid4
from app.db.session import AsyncSessionLocal
from sqlalchemy import text

async def seed():
    async with AsyncSessionLocal() as db:
        # Users
        await db.execute(text('''
            INSERT INTO users (id, email, hashed_password, full_name, username, role, is_active, is_superuser, email_verified, created_at)
            VALUES (:id, 'admin@iris.local', :hash, 'Администратор', 'admin', 'admin', true, false, true, now())
            ON CONFLICT DO NOTHING
        '''), {'id': 1, 'hash': '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW'})
        
        # Projects
        await db.execute(text('''
            INSERT INTO projects (id, name, code, status, created_at, updated_at, created_by_id)
            VALUES 
            (1, 'ЖК Солнечный', 'SOL-2024-001', 'active', now(), now(), 1),
            (2, 'ТЦ Галерея', 'GAL-2024-002', 'planning', now(), now(), 1),
            (3, 'Склад Логистика', 'LOG-2023-015', 'completed', now(), now(), 1)
            ON CONFLICT DO NOTHING
        '''))
        
        # Remarks with all NOT NULL fields
        await db.execute(text('''
            INSERT INTO remarks (
                id, project_id, title, description, status, priority, category, source, 
                author_id, related_remark_ids, attachments, history, created_at, updated_at
            )
            VALUES 
            (:id1, 1, 'Несоответствие отметок', 'Обнаружено несоответствие отметок на чертеже', 
             'open', 'medium', 'other', 'internal', 1, ARRAY[]::uuid[], '[]'::jsonb, '[]'::jsonb, now(), now()),
            (:id2, 1, 'Ошибка в спецификации', 'Неверно указан материал в спецификации', 
             'open', 'high', 'design', 'customer', 1, ARRAY[]::uuid[], '[]'::jsonb, '[]'::jsonb, now(), now()),
            (:id3, 2, 'Неточность размеров', 'Размеры фундамента не соответствуют проекту', 
             'in_progress', 'low', 'other', 'internal', 1, ARRAY[]::uuid[], '[]'::jsonb, '[]'::jsonb, now(), now())
            ON CONFLICT DO NOTHING
        '''), {'id1': str(uuid4()), 'id2': str(uuid4()), 'id3': str(uuid4())})
        
        await db.commit()
        print('Seed done')

asyncio.run(seed())
