import sqlite3

conn = sqlite3.connect('iris_dev.db')

# Check if projects has uuid column
cursor = conn.execute("PRAGMA table_info(projects)")
cols = [row[1] for row in cursor.fetchall()]

if 'uuid' in cols:
    print("Projects have UUID column:")
    result = conn.execute("SELECT id, uuid, name FROM projects LIMIT 3").fetchall()
    for row in result:
        print(f"  ID={row[0]}, UUID={row[1]}, Name={row[2]}")
else:
    print("No UUID column in projects")
    print(f"Columns: {cols}")

conn.close()
