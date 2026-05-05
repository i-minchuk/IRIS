"""Fix all datetime format issues in all tables"""
import sqlite3

conn = sqlite3.connect('iris_dev.db')
cursor = conn.cursor()

fixed = 0

# Fix remarks.due_date
cursor.execute("SELECT id, due_date FROM remarks WHERE due_date IS NOT NULL")
for row in cursor.fetchall():
    remark_id, due_date = row
    if due_date and ' ' in due_date and 'T' not in due_date:
        new_date = due_date.replace(' ', 'T')
        cursor.execute("UPDATE remarks SET due_date = ? WHERE id = ?", (new_date, remark_id))
        fixed += 1
        print(f"Fixed remarks.due_date: {remark_id} -> {new_date}")

# Fix projects.updated_at
cursor.execute("SELECT id, updated_at FROM projects WHERE updated_at IS NOT NULL")
for row in cursor.fetchall():
    proj_id, updated_at = row
    if updated_at and ' ' in updated_at and 'T' not in updated_at:
        new_date = updated_at.replace(' ', 'T')
        cursor.execute("UPDATE projects SET updated_at = ? WHERE id = ?", (new_date, proj_id))
        fixed += 1
        print(f"Fixed projects.updated_at: {proj_id} -> {new_date}")

# Fix documents.updated_at
cursor.execute("SELECT id, updated_at FROM documents WHERE updated_at IS NOT NULL")
for row in cursor.fetchall():
    doc_id, updated_at = row
    if updated_at and ' ' in updated_at and 'T' not in updated_at:
        new_date = updated_at.replace(' ', 'T')
        cursor.execute("UPDATE documents SET updated_at = ? WHERE id = ?", (new_date, doc_id))
        fixed += 1
        print(f"Fixed documents.updated_at: {doc_id} -> {new_date}")

conn.commit()
print(f"\nTotal fixed: {fixed} records")

conn.close()
