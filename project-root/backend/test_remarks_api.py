"""Test remarks API endpoint"""
import sys
sys.path.insert(0, '.')

from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token

client = TestClient(app)

# Create mock token
token = create_access_token(data={"sub": "1"})
headers = {"Authorization": f"Bearer {token}"}

print("Testing /api/v1/remarks...")
try:
    resp = client.get("/api/v1/remarks?page=1&page_size=10", headers=headers, timeout=10)
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        print(f"Total: {data.get('total')}")
        print(f"Items: {len(data.get('remarks', []))}")
        if data.get('remarks'):
            print("\nFirst item:")
            print(f"  ID: {data['remarks'][0].get('id')}")
            print(f"  Title: {data['remarks'][0].get('title')}")
            print(f"  Status: {data['remarks'][0].get('status')}")
            print(f"  Priority: {data['remarks'][0].get('priority')}")
    else:
        print(f"Error: {resp.text}")
except Exception as e:
    print(f"Exception: {e}")
