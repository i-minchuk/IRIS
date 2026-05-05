"""Создание таблицы remarks с удалением старой"""
import sqlite3

conn = sqlite3.connect('iris_dev.db')

# Удаляем старую таблицу
conn.execute("DROP TABLE IF EXISTS remarks")
conn.commit()
print("Table remarks dropped")
conn.close()
