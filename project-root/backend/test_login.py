import sqlite3
import requests
import json

# Check current hash in DB
conn = sqlite3.connect('iris_dev.db')
cursor = conn.cursor()
cursor.execute("SELECT email, hashed_password FROM users WHERE email='admin@iris.local'")
user = cursor.fetchone()
print(f"User in DB: {user[0]}, hash: {user[1][:30]}...")

# Try login
login_data = {"username": "admin@iris.local", "password": "admin123"}
resp = requests.post("http://localhost:8000/api/v1/auth/login", json=login_data)
print(f"\nLogin response status: {resp.status_code}")
print(f"Response body: {resp.text[:300]}")

conn.close()
