import sqlite3

conn = sqlite3.connect('iris_dev.db')

# Check projects table columns
print("Projects table columns:")
cols = conn.execute("PRAGMA table_info(projects)").fetchall()
for col in cols:
    print(f"  {col[1]} ({col[2]})")

conn.close()
