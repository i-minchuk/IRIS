"""Add missing columns to projects table"""
import sqlite3

conn = sqlite3.connect('iris_dev.db')
cursor = conn.cursor()

# List of columns to add
columns_to_add = [
    ('customer_name', 'TEXT'),
    ('contract_number', 'TEXT'),
    ('contract_date', 'TEXT'),
    ('stage', 'TEXT'),
    ('standard_template_id', 'INTEGER'),
    ('variables', 'TEXT'),
    ('created_by_id', 'INTEGER'),
]

for col_name, col_type in columns_to_add:
    # Check if column exists
    cursor.execute(f"PRAGMA table_info(projects)")
    cols = [row[1] for row in cursor.fetchall()]
    
    if col_name not in cols:
        print(f"Adding column: {col_name} {col_type}")
        try:
            cursor.execute(f"ALTER TABLE projects ADD COLUMN {col_name} {col_type}")
            print(f"  [OK] Added")
        except Exception as e:
            print(f"  [ERROR] {e}")
    else:
        print(f"Column {col_name} already exists")

conn.commit()

# Verify
print("\nFinal schema:")
cursor.execute("PRAGMA table_info(projects)")
for col in cursor.fetchall():
    print(f"  {col[1]} ({col[2]})")

conn.close()
print("\nDone!")
