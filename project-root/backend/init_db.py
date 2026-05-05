import sqlite3
from datetime import datetime, timedelta
import uuid

conn = sqlite3.connect('iris_dev.db')

# Users
conn.execute('''CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    email TEXT,
    username TEXT,
    hashed_password TEXT,
    full_name TEXT,
    role TEXT,
    is_active INTEGER,
    is_superuser INTEGER,
    email_verified INTEGER,
    reset_token TEXT,
    reset_token_expires TEXT,
    created_at TEXT
)''')

now = datetime.utcnow()
conn.execute('''INSERT INTO users VALUES (1, 'admin@iris.local', 'admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILp92S.0i', 'Admin', 'admin', 1, 1, 1, NULL, NULL, ?)''', (now.strftime('%Y-%m-%d %H:%M:%S'),))

# Projects
conn.execute('''CREATE TABLE projects (
    id INTEGER PRIMARY KEY,
    name TEXT,
    code TEXT,
    description TEXT,
    status TEXT,
    start_date TEXT,
    planned_finish TEXT,
    forecast_finish TEXT,
    manager_id INTEGER,
    created_at TEXT,
    updated_at TEXT
)''')
projects = [
    (1, 'Проект Альфа', 'ALPHA', 'Демо проект', 'active', '2026-01-01', '2026-06-30', '2026-05-31', 1, now.strftime('%Y-%m-%d %H:%M:%S'), now.strftime('%Y-%m-%d %H:%M:%S')),
    (2, 'Проект Бета', 'BETA', 'Тестовый проект', 'planning', '2026-02-01', '2026-08-31', '2026-07-15', 1, now.strftime('%Y-%m-%d %H:%M:%S'), now.strftime('%Y-%m-%d %H:%M:%S')),
]
for p in projects:
    conn.execute('INSERT INTO projects VALUES (?,?,?,?,?,?,?,?,?,?,?)', p)

# Documents
conn.execute('''CREATE TABLE documents (
    id INTEGER PRIMARY KEY,
    project_id INTEGER,
    operation_id INTEGER,
    number TEXT,
    name TEXT,
    doc_type TEXT,
    status TEXT,
    planned_ready TEXT,
    actual_ready TEXT,
    planned_start TEXT,
    planned_end TEXT,
    actual_start TEXT,
    actual_end TEXT,
    duration_hours INTEGER,
    created_at TEXT,
    updated_at TEXT
)''')
docs = [
    (1, 1, 1, 'АР-001', 'Архитектурные решения', 'architectural', 'in_review', '2026-02-15', None, '2026-01-15', '2026-02-15', None, None, 720, now.strftime('%Y-%m-%d %H:%M:%S'), now.strftime('%Y-%m-%d %H:%M:%S')),
    (2, 1, 2, 'КР-001', 'Конструктивные решения', 'structural', 'approved', '2026-03-01', '2026-03-01', '2026-02-01', '2026-03-01', None, None, 960, now.strftime('%Y-%m-%d %H:%M:%S'), now.strftime('%Y-%m-%d %H:%M:%S')),
]
for d in docs:
    conn.execute('INSERT INTO documents VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', d)

# Remarks
conn.execute('''CREATE TABLE remarks (
    id TEXT PRIMARY KEY,
    project_id INTEGER,
    document_id INTEGER,
    revision_id INTEGER,
    workflow_step_id INTEGER,
    source TEXT,
    status TEXT,
    priority TEXT,
    category TEXT,
    title TEXT,
    description TEXT,
    location_ref TEXT,
    author_id INTEGER,
    assignee_id INTEGER,
    due_date TEXT,
    resolution TEXT,
    resolved_by INTEGER,
    resolved_at TEXT,
    parent_id TEXT,
    related_remark_ids TEXT,
    attachments TEXT,
    history TEXT,
    created_at TEXT,
    updated_at TEXT
)''')
uids = [str(uuid.uuid4()) for _ in range(3)]
remarks = [
    (uids[0], 1, 1, None, None, 'internal', 'new', 'high', 'other', 'Несоответствие отметок высот', 'Отметки высот не совпадают', '', 1, None, (now + timedelta(days=7)).strftime('%Y-%m-%d %H:%M:%S'), None, None, None, None, None, None, None, now.strftime('%Y-%m-%d %H:%M:%S'), now.strftime('%Y-%m-%d %H:%M:%S')),
    (uids[1], 1, 2, None, None, 'internal', 'in_progress', 'medium', 'design_error', 'Отсутствует привязка колонн', 'Не указаны оси привязки', '', 1, 2, None, None, None, None, None, None, None, None, now.strftime('%Y-%m-%d %H:%M:%S'), now.strftime('%Y-%m-%d %H:%M:%S')),
    (uids[2], 1, 3, None, None, 'internal', 'resolved', 'low', 'discrepancy', 'Проверка сечения балок', 'Требуется проверка', '', 1, None, None, None, None, None, None, None, None, None, now.strftime('%Y-%m-%d %H:%M:%S'), now.strftime('%Y-%m-%d %H:%M:%S')),
]
for r in remarks:
    conn.execute('INSERT INTO remarks VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', r)

# Tenders
conn.execute('''CREATE TABLE tenders (
    id INTEGER PRIMARY KEY,
    project_id INTEGER,
    name TEXT,
    code TEXT,
    description TEXT,
    status TEXT,
    tender_type TEXT,
    planned_start TEXT,
    planned_end TEXT,
    actual_start TEXT,
    actual_end TEXT,
    created_at TEXT,
    updated_at TEXT
)''')
tenders = [
    (1, 1, 'Тендер на генподряд', 'GEN-001', 'Поиск генподрядчика', 'planned', 'general', '2026-03-01', '2026-03-31', None, None, now.strftime('%Y-%m-%d %H:%M:%S'), now.strftime('%Y-%m-%d %H:%M:%S')),
    (2, 1, 'Тендер на МГН', 'MEP-001', 'Инженерные системы', 'ongoing', 'mgn', '2026-04-01', '2026-04-30', '2026-04-01', None, now.strftime('%Y-%m-%d %H:%M:%S'), now.strftime('%Y-%m-%d %H:%M:%S')),
]
for t in tenders:
    conn.execute('INSERT INTO tenders VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)', t)

conn.commit()
print('Database initialized successfully')
print(f'Users: 1')
print(f'Projects: {len(projects)}')
print(f'Documents: {len(docs)}')
print(f'Remarks: {len(remarks)}')
print(f'Tenders: {len(tenders)}')
conn.close()
