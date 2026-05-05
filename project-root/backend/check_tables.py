import sqlite3
conn = sqlite3.connect('iris_dev.db')
tables = [r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").fetchall()]
print("Tables in database:")
for t in tables:
    print(f"  - {t}")
conn.close()
