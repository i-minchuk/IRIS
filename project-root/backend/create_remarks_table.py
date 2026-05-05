"""Создание таблицы remarks с правильными типами для SQLite"""
import sqlite3
from datetime import datetime, timedelta
import uuid

conn = sqlite3.connect('iris_dev.db')
conn.execute("DROP TABLE IF EXISTS remarks")
conn.execute("CREATE TABLE remarks (id TEXT PRIMARY KEY, project_id INTEGER, document_id INTEGER, revision_id INTEGER, workflow_step_id INTEGER, source TEXT, status TEXT, priority TEXT, category TEXT, title TEXT, description TEXT, location_ref TEXT, author_id INTEGER, assignee_id INTEGER, due_date TEXT, resolution TEXT, resolved_by INTEGER, resolved_at TEXT, parent_id TEXT, related_remark_ids TEXT, attachments TEXT, history TEXT, created_at TEXT, updated_at TEXT)")
conn.commit()
print("Table remarks created")

now = datetime.utcnow()
uids = [str(uuid.uuid4()) for _ in range(3)]
data = [
    (uids[0], 1, 1, None, None, 'internal', 'new', 'high', 'other', 'Несоответствие отметок высот', 'Отметки высот не совпадают', '', 1, None, (now + timedelta(days=7)).isoformat(), None, None, None, None, None, None, None, now.isoformat(), now.isoformat()),
    (uids[1], 1, 2, None, None, 'internal', 'in_progress', 'medium', 'design_error', 'Отсутствует привязка колонн', 'Не указаны оси привязки', '', 1, 2, None, None, None, None, None, None, None, now.isoformat(), now.isoformat()),
    (uids[2], 1, 3, None, None, 'internal', 'resolved', 'low', 'discrepancy', 'Проверка сечения балок', 'Требуется проверка', '', 1, None, None, None, None, None, None, None, now.isoformat(), now.isoformat()),
]
for row in data:
    conn.execute("INSERT INTO remarks VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", row)
conn.commit()
print(f"Added {len(data)} remarks")
conn.close()
