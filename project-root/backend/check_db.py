"""Проверка состояния SQLite БД"""
import sqlite3

conn = sqlite3.connect('iris_dev.db')
cursor = conn.execute('SELECT name FROM sqlite_master WHERE type="table"')
tables = [row[0] for row in cursor.fetchall()]
print('Tables:', tables)

# Проверка users
cursor = conn.execute('PRAGMA table_info(users)')
columns = [row[1] for row in cursor.fetchall()]
print('Users columns:', columns)

conn.close()
