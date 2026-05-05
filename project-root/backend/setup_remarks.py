import sqlite3
from datetime import datetime, timedelta
import uuid

conn = sqlite3.connect('iris_dev.db')
conn.execute('DROP TABLE IF EXISTS remarks')
conn.execute('CREATE TABLE remarks (id TEXT, project_id INTEGER, document_id INTEGER, revision_id INTEGER, workflow_step_id INTEGER, source TEXT, status TEXT, priority TEXT, category TEXT, title TEXT, description TEXT, location_ref TEXT, author_id INTEGER, assignee_id INTEGER, due_date TEXT, resolution TEXT, resolved_by INTEGER, resolved_at TEXT, parent_id TEXT, related_remark_ids TEXT, attachments TEXT, history TEXT, created_at TEXT, updated_at TEXT)')

now = datetime.utcnow()
uids = [str(uuid.uuid4()) for _ in range(3)]

# Insert each row separately to avoid multi-line tuple issues
# Using simple datetime format without microseconds
row1 = [uids[0], 1, 1, None, None, 'internal', 'new', 'high', 'other', 'Несоответствие отметок высот', 'Отметки высот не совпадают', '', 1, None, (now + timedelta(days=7)).strftime('%Y-%m-%d %H:%M:%S'), None, None, None, None, None, None, None, now.strftime('%Y-%m-%d %H:%M:%S'), now.strftime('%Y-%m-%d %H:%M:%S')]
print(f"Row1 length: {len(row1)}")
conn.execute('INSERT INTO remarks VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', row1)
print("Row1 inserted")

row2 = [uids[1], 1, 2, None, None, 'internal', 'in_progress', 'medium', 'design_error', 'Отсутствует привязка колонн', 'Не указаны оси привязки', '', 1, 2, None, None, None, None, None, None, None, None, now.strftime('%Y-%m-%d %H:%M:%S'), now.strftime('%Y-%m-%d %H:%M:%S')]
print(f"Row2 length: {len(row2)}")
conn.execute('INSERT INTO remarks VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', row2)
print("Row2 inserted")

row3 = [uids[2], 1, 3, None, None, 'internal', 'resolved', 'low', 'discrepancy', 'Проверка сечения балок', 'Требуется проверка', '', 1, None, None, None, None, None, None, None, None, None, now.strftime('%Y-%m-%d %H:%M:%S'), now.strftime('%Y-%m-%d %H:%M:%S')]
print(f"Row3 length: {len(row3)}")
conn.execute('INSERT INTO remarks VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', row3)
print("Row3 inserted")

conn.commit()
print('Added 3 remarks')
conn.close()
