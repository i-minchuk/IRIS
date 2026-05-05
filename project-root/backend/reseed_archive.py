"""Re-seed archive tables with correct UUIDs"""
import sqlite3
import json
from datetime import datetime, timedelta
from uuid import uuid4

conn = sqlite3.connect('iris_dev.db')

# Clear existing data
conn.execute("DELETE FROM archive_constructions")
conn.execute("DELETE FROM archive_materials")
conn.execute("DELETE FROM archive_entries")

# Get first project ID
project_id = conn.execute("SELECT id FROM projects LIMIT 1").fetchone()[0]
print(f"Using project_id: {project_id}")

now = datetime.now()

# Helper to serialize lists
def serialize_list(lst):
    return json.dumps(lst) if lst else '[]'

# Generate UUIDs
uuids = [str(uuid4()) for _ in range(10)]

# Seed archive_entries (source_id must be UUID)
entries = [
    (uuids[0], project_id, 'project_event', 'projects', uuids[0], 'Проект создан', None, None, 1, (now - timedelta(days=30)).strftime('%Y-%m-%d %H:%M:%S'), serialize_list([]), serialize_list([]), serialize_list([]), 0, 0, 0, 0),
    (uuids[1], project_id, 'milestone', 'projects', uuids[1], 'Утверждение ТЗ', None, None, 1, (now - timedelta(days=25)).strftime('%Y-%m-%d %H:%M:%S'), serialize_list([]), serialize_list([]), serialize_list([]), 0, 0, 0, 0),
    (uuids[2], project_id, 'document', 'documents', uuids[2], 'Создание документа КМ', None, None, 1, (now - timedelta(days=20)).strftime('%Y-%m-%d %H:%M:%S'), serialize_list([]), serialize_list([]), serialize_list([]), 0, 0, 0, 0),
    (uuids[3], project_id, 'remark', 'remarks', uuids[3], 'Замечание к КМ', None, None, 1, (now - timedelta(days=15)).strftime('%Y-%m-%d %H:%M:%S'), serialize_list([]), serialize_list([]), serialize_list([]), 0, 0, 0, 0),
    (uuids[4], project_id, 'workflow', 'documents', uuids[4], 'Запуск согласования', None, None, 1, (now - timedelta(days=10)).strftime('%Y-%m-%d %H:%M:%S'), serialize_list([]), serialize_list([]), serialize_list([]), 0, 0, 0, 0),
    (uuids[5], project_id, 'document', 'documents', uuids[5], 'Утверждение КМ', None, None, 1, (now - timedelta(days=5)).strftime('%Y-%m-%d %H:%M:%S'), serialize_list([]), serialize_list([]), serialize_list([]), 0, 0, 0, 0),
    (uuids[6], project_id, 'material', 'materials', uuids[6], 'Поставка арматуры', None, None, 1, (now - timedelta(days=3)).strftime('%Y-%m-%d %H:%M:%S'), serialize_list([]), serialize_list([]), serialize_list([]), 0, 0, 0, 0),
    (uuids[7], project_id, 'construction', 'constructions', uuids[7], 'Монтаж колонн 1 этажа', None, None, 1, now.strftime('%Y-%m-%d %H:%M:%S'), serialize_list([]), serialize_list([]), serialize_list([]), 0, 0, 0, 0),
]

conn.executemany('''
    INSERT INTO archive_entries (id, project_id, entry_type, source_table, source_id, title, description, content_snapshot, author_id, occurred_at, tags, attachments, related_entry_ids, is_pinned, is_deleted, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
''', entries)

# Seed archive_materials
materials = [
    (uuids[8], project_id, 'steel', 'Арматура A500C', 'd16', 'Северсталь', 500, 'кг', serialize_list([]), serialize_list([]), serialize_list([]), uuids[6], 0, 0),
    (uuids[9], project_id, 'concrete', 'Бетон B25', 'М400', 'ЕвроБетон', 100, 'м3', serialize_list([]), serialize_list([]), serialize_list([]), None, 0, 0),
]

conn.executemany('''
    INSERT INTO archive_materials (id, project_id, material_type, name, specification, manufacturer, quantity, unit, used_in_constructions, certificates, attached_files, entry_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
''', materials)

# Seed archive_constructions
constructions = [
    (str(uuid4()), project_id, 'column', 'Колонна К1', 'К1-1', 'Этаж 1', serialize_list(["арматура", "бетон"]), serialize_list([]), 'in_production', None, None, None, serialize_list([]), uuids[7], 0, 0),
    (str(uuid4()), project_id, 'beam', 'Балка Б1', 'Б1-1', 'Этаж 1', serialize_list(["профиль"]), serialize_list([]), 'planned', None, None, None, serialize_list([]), None, 0, 0),
    (str(uuid4()), project_id, 'slab', 'Плита П1', 'П1-1', 'Этаж 1', serialize_list(["бетон", "арматура"]), serialize_list([]), 'planned', None, None, None, serialize_list([]), None, 0, 0),
]

conn.executemany('''
    INSERT INTO archive_constructions (id, project_id, name, construction_type, designation, location, materials_used, documents_related, status, installed_at, tested_at, accepted_at, photos, entry_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
''', constructions)

conn.commit()

# Verify
print("\nAfter reseeding:")
for table in ['archive_entries', 'archive_materials', 'archive_constructions']:
    count = conn.execute(f'SELECT COUNT(*) FROM {table}').fetchone()[0]
    print(f"  {table}: {count} records")

conn.close()
print("\nDone!")
