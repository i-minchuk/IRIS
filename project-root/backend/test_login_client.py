"""Test login with TestClient"""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# Try login
login_data = {"email": "admin@iris.local", "password": "admin123"}
resp = client.post("/api/v1/auth/login", json=login_data)

print(f"Status: {resp.status_code}")
if resp.status_code == 200:
    print(f"Token: {resp.json()['access_token'][:30]}...")
else:
    print(f"Error: {resp.json()}")

# Check user in DB
import sqlite3
conn = sqlite3.connect('iris_dev.db')
user = conn.execute("SELECT email, hashed_password FROM users WHERE email='admin@iris.local'").fetchone()
print(f"\nDB user: {user[0]}, hash: {user[1][:30]}...")

from app.core.security import verify_password
print(f"Verify password locally: {verify_password('admin123', user[1])}")
conn.close()
