"""Direct password reset in SQLite using hardcoded hash"""
import sqlite3

# Hardcoded correct hash for 'admin123'
correct_hash = "$2b$12$um25N6KUiSYFTVyi9D2dUuGwdUZn8C5330lU0ucPOE1nyajb0ZnSq"

conn = sqlite3.connect('iris_dev.db')
cursor = conn.cursor()

cursor.execute("UPDATE users SET hashed_password = ? WHERE email = 'admin@iris.local'", (correct_hash,))
conn.commit()

print(f"Password updated for admin@iris.local")
print(f"Password: admin123")
print(f"Hash: {correct_hash}")

# Verify
cursor.execute("SELECT email, hashed_password FROM users WHERE email='admin@iris.local'")
user = cursor.fetchone()
print(f"\nVerification - Current hash in DB: {user[1]}")

from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

try:
    result = pwd_context.verify("admin123", user[1])
    print(f"Password verification: {'SUCCESS' if result else 'FAILED'}")
except Exception as e:
    print(f"Verification error: {e}")

conn.close()
