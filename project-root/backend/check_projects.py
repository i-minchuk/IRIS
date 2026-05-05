"""Проверка проектов"""
import sqlite3

conn = sqlite3.connect('iris_dev.db')
cursor = conn.execute('PRAGMA table_info(projects)')
columns = [row[1] for row in cursor.fetchall()]
print('Projects columns:', columns)
conn.close()
