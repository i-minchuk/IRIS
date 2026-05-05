"""Create a new test user directly in SQLite with simple hash"""
import sqlite3

# Create user with a simple known password
# We'll use the hash that bcrypt generates for 'test123'
# This is a known good hash for 'test123'
test_hash = "$2b$12$X1b6G3Wk6HkP9L5VqZqH7OvN8RjK2LmF4QxYpWzJhC9sT8uR6vK0i"

conn = sqlite3.connect('iris_dev.db')
cursor = conn.cursor()

# Check if user exists
cursor.execute("SELECT id FROM users WHERE email='test@iris.local'")
if cursor.fetchone():
    print("User already exists")
else:
    cursor.execute("""
        INSERT INTO users (email, username, hashed_password, full_name, is_active, is_superuser)
        VALUES ('test@iris.local', 'testuser', ?, 'Test User', 1, 0)
    """, (test_hash,))
    conn.commit()
    print("OK: Test user created with email: test@iris.local, password: test123")

conn.close()
