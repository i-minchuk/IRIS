import sqlite3
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Hash the password
password = "admin123"
hashed = pwd_context.hash(password)
print(f"Generated hash: {hashed}")

# Update database
conn = sqlite3.connect('iris_dev.db')
conn.execute('UPDATE users SET hashed_password=? WHERE id=1', (hashed,))
conn.commit()
print("Password reset for admin@iris.local")
conn.close()
