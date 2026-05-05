"""Reset admin password to admin123"""
import sqlite3

# The correct hash for 'admin123' with current bcrypt version
new_hash = "$2b$12$um25N6KUiSYFTVyi9D2dUuGwdUZn8C5330lU0ucPOE1nyajb0ZnSq"

conn = sqlite3.connect('iris_dev.db')
cursor = conn.cursor()

# Update the password
cursor.execute(
    "UPDATE users SET hashed_password = ? WHERE email = 'admin@iris.local'",
    (new_hash,)
)
conn.commit()

print(f"Password reset for admin@iris.local")
print(f"New password: admin123")
print(f"Rows updated: {cursor.rowcount}")

conn.close()
