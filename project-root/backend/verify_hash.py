import sqlite3

c = sqlite3.connect('iris_dev.db')
user = c.execute("SELECT email, hashed_password FROM users WHERE email='admin@iris.local'").fetchone()
print(f"Email: {user[0]}")
print(f"Hash in DB: {user[1]}")
c.close()

# Test password verification
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

test_hash = "$2b$12$um25N6KUiSYFTVyi9D2dUuGwdUZn8C5330lU0ucPOE1nyajb0ZnSq"
old_hash = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILp92S.0i"

print(f"\nVerifying 'admin123' against new hash: {pwd_context.verify('admin123', test_hash)}")
print(f"Verifying 'admin123' against old hash: {pwd_context.verify('admin123', old_hash)}")
