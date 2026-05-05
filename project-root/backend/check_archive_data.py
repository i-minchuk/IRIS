import sqlite3

conn = sqlite3.connect('iris_dev.db')

# Check archive_entries
print("Archive entries:")
result = conn.execute("SELECT id, project_id, source_id FROM archive_entries LIMIT 3").fetchall()
for row in result:
    print(f"  id={row[0][:20]}..., project_id={row[1]}, source_id={row[2][:20]}...")

conn.close()
