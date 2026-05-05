import sqlite3
import json

conn = sqlite3.connect('iris_dev.db')

# Check document_remarks
try:
    count = conn.execute('SELECT COUNT(*) FROM document_remarks').fetchone()[0]
    print(f'document_remarks: {count}')
except Exception as e:
    print(f'document_remarks: Error - {e}')

# Check remarks
try:
    count = conn.execute('SELECT COUNT(*) FROM remarks').fetchone()[0]
    print(f'remarks: {count}')
    
    # Show sample data
    print('\nSample remark:')
    cols = [d[0] for d in conn.execute('PRAGMA table_info(remarks)').fetchall()]
    row = conn.execute('SELECT * FROM remarks LIMIT 1').fetchone()
    if row:
        print(f'Columns: {cols}')
        print(f'Data: {dict(zip(cols, row))}')
except Exception as e:
    print(f'remarks: Error - {e}')

conn.close()
