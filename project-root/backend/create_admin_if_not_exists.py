"""Check if admin user exists and create if not"""
import sqlite3
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
hashed_password = pwd_context.hash("admin123")

conn = sqlite3.connect('iris_dev.db')
cursor = conn.cursor()

# Check if user exists
cursor.execute("SELECT id, email FROM users WHERE email='admin@iris.local'")
user = cursor.fetchone()

if user:
    print(f"User already exists: {user[1]}")
else:
    cursor.execute("""
        INSERT INTO users (email, username, hashed_password, full_name, is_active, is_superuser)
        VALUES ('admin@iris.local', 'admin', ?, 'Admin', 1, 1)
    """, (hashed_password,))
    conn.commit()
    print("OK: Admin user created")

conn.close()
