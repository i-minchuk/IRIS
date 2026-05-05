"""Test remarks endpoints"""
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
print("Testing /api/v1/remarks/statistics...")
print("=" * 50)
try:
    resp = client.get("/api/v1/remarks/statistics", headers=headers, timeout=10)
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        print(f"Response: {resp.json()}")
    else:
        print(f"Error: {resp.text}")
except Exception as e:
    print(f"Exception: {e}")

print("\n" + "=" * 50)
print("Testing /api/v1/remarks/tags...")
print("=" * 50)
try:
    resp = client.get("/api/v1/remarks/tags", headers=headers, timeout=10)
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        print(f"Response: {data}")
        print(f"Tags count: {len(data)}")
    else:
        print(f"Error: {resp.text}")
except Exception as e:
    print(f"Exception: {e}")
