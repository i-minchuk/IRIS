"""Test projects endpoint"""
import sys
sys.path.insert(0, '.')

from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token

client = TestClient(app)

# Create valid token
token = create_access_token(data={"sub": "1"})
headers = {"Authorization": f"Bearer {token}"}

print("=" * 50)
print("Testing /api/v1/projects...")
print("=" * 50)

resp = client.get("/api/v1/projects", headers=headers)
print(f"Status: {resp.status_code}")
print(f"Body: {resp.text[:500] if resp.text else 'empty'}")
