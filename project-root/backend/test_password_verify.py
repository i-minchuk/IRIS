"""Test password verification using backend's security module"""
import sys
sys.path.insert(0, '.')

from app.core.security import verify_password, get_password_hash

# Test the current hash
test_hash = "$2b$12$um25N6KUiSYFTVyi9D2dUuGwdUZn8C5330lU0ucPOE1nyajb0ZnSq"
print(f"Testing hash: {test_hash}")
print(f"Verify 'admin123': {verify_password('admin123', test_hash)}")

# Generate new hash
new_hash = get_password_hash("admin123")
print(f"\nNew hash generated: {new_hash}")
print(f"Verify 'admin123' against new: {verify_password('admin123', new_hash)}")
