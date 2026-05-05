import sqlite3

c = sqlite3.connect('iris_dev.db')
tables = [r[0] for r in c.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]

print("Archive tables:")
for t in ['archive_entries', 'archive_materials', 'archive_constructions']:
    if t in tables:
        count = c.execute(f'SELECT COUNT(*) FROM {t}').fetchone()[0]
        print(f"  {t}: {count} records")
    else:
        print(f"  {t}: NOT FOUND")

c.close()
