"""Fix datetime format in remarks table for SQLite"""
import sqlite3

conn = sqlite3.connect('iris_dev.db')
cursor = conn.cursor()

# Get all remarks with datetime issues
cursor.execute("SELECT id, created_at, updated_at FROM remarks")
rows = cursor.fetchall()

fixed = 0
for remark_id, created_at, updated_at in rows:
    # Convert '2026-05-10 20:11:18' to '2026-05-10T20:11:18'
    new_created = created_at.replace(' ', 'T') if created_at and ' ' in created_at else created_at
    new_updated = updated_at.replace(' ', 'T') if updated_at and ' ' in updated_at else updated_at
    
    if new_created != created_at or new_updated != updated_at:
        cursor.execute(
            "UPDATE remarks SET created_at = ?, updated_at = ? WHERE id = ?",
            (new_created, new_updated, remark_id)
        )
        fixed += 1
        print(f"Fixed remark {remark_id}: {created_at} -> {new_created}")

conn.commit()
print(f"\nFixed {fixed} remarks")

# Verify
cursor.execute("SELECT id, created_at FROM remarks LIMIT 3")
for row in cursor.fetchall():
    print(f"Verified: {row[0]} -> {row[1]}")

conn.close()
