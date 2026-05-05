import sqlite3

c = sqlite3.connect('iris_dev.db')

# Get all tables
tables = [r[0] for r in c.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
print("Tables:", tables)

# Check counts
for table in ['remarks', 'documents', 'projects', 'remark_comments', 'remark_tags']:
    if table in tables:
        count = c.execute(f'SELECT COUNT(*) FROM {table}').fetchone()[0]
        print(f'{table} count: {count}')
    else:
        print(f'{table}: NOT FOUND')

c.close()
