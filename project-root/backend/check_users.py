import sqlite3
import hashlib

c = sqlite3.connect('iris_dev.db')

# Check users
users = c.execute("SELECT id, email, full_name, is_active, is_superuser FROM users").fetchall()
print("Users in database:")
for u in users:
    print(f"  ID={u[0]}, email={u[1]}, name={u[2]}, active={u[3]}, admin={u[4]}")

# Check if there's a default admin
print("\nChecking for admin user creation...")
c.close()
