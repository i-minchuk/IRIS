"""Добавление демо-данных в remarks через прямой SQL INSERT"""
import sqlite3
import uuid
from datetime import datetime, timedelta

conn = sqlite3.connect('iris_dev.db')
cursor = conn.cursor()

now = datetime.utcnow().isoformat()

# Проверка количества
cursor.execute("SELECT COUNT(*) FROM remarks")
count = cursor.fetchone()[0]
print(f"Remarks count: {count}")

if count < 3:
    new_remarks = [
        (str(uuid.uuid4()), 1, 1, None, None, 'customer', 'new', 'high', 'other', 
         'Несоответствие отметок высот', 'Отметки высот на чертеже АР-001 не совпадают с разрезом', 
         '', 1, None, (datetime.utcnow() + timedelta(days=7)).isoformat(), 
         None, None, None, None, None, None, now, now),
        (str(uuid.uuid4()), 1, 2, None, None, 'internal', 'in_progress', 'medium', 'design_error', 
         'Отсутствует привязка колонн', 'На плане этажа КР-001 не указаны оси привязки', 
         '', 1, 2, None, None, None, None, None, None, now, now),
        (str(uuid.uuid4()), 1, 3, None, None, 'internal', 'resolved', 'low', 'discrepancy', 
         'Проверка сечения балок', 'Требуется проверить сечение балок перекрытия', 
         '', 1, None, None, None, None, None, None, now, now),
    ]
    
    for remark in new_remarks:
        cursor.execute("""
            INSERT INTO remarks (id, project_id, document_id, revision_id, workflow_step_id, 
                               source, status, priority, category, title, description, 
                               location_ref, author_id, assignee_id, due_date, resolution, 
                               resolved_by, resolved_at, parent_id, related_remark_ids, 
                               attachments, history, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, remark)
    
    conn.commit()
    print(f"Added {len(new_remarks)} remarks")

conn.close()
