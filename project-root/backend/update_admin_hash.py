"""Update admin password with new hash"""
import sqlite3
import sys
sys.path.insert(0, '.')

from app.core.security import get_password_hash

new_hash = get_password_hash("admin123")
print(f"New hash: {new_hash}")

conn = sqlite3.connect('iris_dev.db')
cursor = conn.cursor()
cursor.execute("UPDATE users SET hashed_password = ? WHERE email = 'admin@iris.local'", (new_hash,))
conn.commit()
print(f"Updated password for admin@iris.local")
print(f"Rows affected: {cursor.rowcount}")
conn.close()
