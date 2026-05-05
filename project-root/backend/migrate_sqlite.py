"""Миграция SQLite: добавление missing колонок"""
import sqlite3

conn = sqlite3.connect('iris_dev.db')
cursor = conn.cursor()

# Проверка и добавление колонок для projects
projects_columns = [
    ('projects', 'planned_finish', 'DATETIME'),
    ('projects', 'forecast_finish', 'DATETIME'),
    ('projects', 'manager_id', 'INTEGER'),
]

# Проверка и добавление колонок для documents
documents_columns = [
    ('documents', 'operation_id', 'INTEGER'),
    ('documents', 'planned_ready', 'DATETIME'),
    ('documents', 'actual_ready', 'DATETIME'),
    ('documents', 'planned_start', 'DATETIME'),
    ('documents', 'planned_end', 'DATETIME'),
    ('documents', 'actual_start', 'DATETIME'),
    ('documents', 'actual_end', 'DATETIME'),
    ('documents', 'duration_hours', 'FLOAT'),
]

for table, col, col_type in projects_columns + documents_columns:
    cursor.execute(f"PRAGMA table_info({table})")
    existing = [row[1] for row in cursor.fetchall()]
    if col not in existing:
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}")
        print(f"Added {col} to {table}")
    else:
        print(f"{col} already exists in {table}")

conn.commit()
conn.close()

print("\nMigration completed!")
