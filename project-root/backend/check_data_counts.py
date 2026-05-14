import sqlite3

conn = sqlite3.connect('iris_dev.db')
c = conn.cursor()

print("=== Database Status ===\n")

# Users
c.execute("SELECT COUNT(*) FROM users")
print(f"Users: {c.fetchone()[0]}")

# Projects
c.execute("SELECT COUNT(*) FROM projects")
print(f"Projects: {c.fetchone()[0]}")

# Documents
c.execute("SELECT COUNT(*) FROM documents")
print(f"Documents: {c.fetchone()[0]}")

# Remarks
c.execute("SELECT COUNT(*) FROM remarks")
print(f"Remarks: {c.fetchone()[0]}")

# Archive entries
c.execute("SELECT COUNT(*) FROM archive_entries")
print(f"Archive entries: {c.fetchone()[0]}")

# Archive materials
c.execute("SELECT COUNT(*) FROM archive_materials")
print(f"Archive materials: {c.fetchone()[0]}")

# Archive constructions
c.execute("SELECT COUNT(*) FROM archive_constructions")
print(f"Archive constructions: {c.fetchone()[0]}")

conn.close()
