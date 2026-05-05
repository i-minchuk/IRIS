"""Find all datetime issues in all tables"""
import sqlite3

conn = sqlite3.connect('iris_dev.db')
cursor = conn.cursor()

# Check all tables for datetime columns
tables = ['remarks', 'users', 'projects', 'documents', 'archive_entries']

for table in tables:
    try:
        cursor.execute(f"PRAGMA table_info({table})")
        cols = cursor.fetchall()
        datetime_cols = [c[1] for c in cols if 'date' in c[1].lower() or 'time' in c[1].lower()]
        
        for col in datetime_cols:
            cursor.execute(f"SELECT id, {col} FROM {table} WHERE {col} IS NOT NULL LIMIT 5")
            rows = cursor.fetchall()
            for row in rows:
                val = row[1]
                if val and ' ' in val and 'T' not in val:
                    print(f"{table}.{col}: id={row[0]}, value='{val}' (needs fix)")
    except Exception as e:
        print(f"Error checking {table}: {e}")

conn.close()
