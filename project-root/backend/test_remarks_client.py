"""Test API directly via TestClient to see full errors"""
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token
import traceback

client = TestClient(app)
token = create_access_token(data={"sub": "1"})

# Test remarks
print("Testing /api/v1/remarks...")
try:
    resp = client.get("/api/v1/remarks?page=1&page_size=10", headers={"Authorization": f"Bearer {token}"})
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        print(f"Success! Remarks: {len(data.get('remarks', []))}")
    else:
        print(f"Error: {resp.text[:500]}")
except Exception as e:
    print(f"Exception: {e}")
    traceback.print_exc()
