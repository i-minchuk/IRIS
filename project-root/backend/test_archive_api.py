"""Test archive endpoints"""
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
print("Testing Archive API endpoints...")
print("=" * 50)

endpoints = [
    "/api/v1/archive/timeline",
    "/api/v1/archive/materials",
    "/api/v1/archive/constructions",
    "/api/v1/archive/entries",
]

for endpoint in endpoints:
    print(f"\n{endpoint}?project_id=1...")
    try:
        resp = client.get(f"{endpoint}?project_id=1", headers=headers)
        print(f"  Status: {resp.status_code}")
        body_preview = resp.text[:150] if resp.text else "empty"
        print(f"  Body: {body_preview}")
    except Exception as e:
        print(f"  Error: {e}")

print("\n" + "=" * 50)
