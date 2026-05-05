"""Test model data"""
import sqlite3
from uuid import UUID
import sqlite3

conn = sqlite3.connect('iris_dev.db')
cursor = conn.cursor()

cursor.execute("SELECT id, status, priority, category, author_id FROM remarks LIMIT 1")
row = cursor.fetchone()
print(f"Raw DB row: {row}")
print(f"status type: {type(row[1])}, value: {row[1]}")
print(f"priority type: {type(row[2])}, value: {row[2]}")
print(f"category type: {type(row[3])}, value: {row[3]}")
print(f"author_id type: {type(row[4])}, value: {row[4]}")

conn.close()
