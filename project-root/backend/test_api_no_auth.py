"""Test API without auth - create simple endpoint"""
from fastapi.testclient import TestClient
from app.main import app
import sqlite3

client = TestClient(app)

# Check remarks endpoint (should require auth, but let's see)
resp = client.get("/api/v1/remarks?page=1&page_size=10")
print(f"Remarks without auth: {resp.status_code}")

# Try with mock token (won't work, just to see error)
from app.core.security import create_access_token
token = create_access_token(data={"sub": "1"})
resp = client.get("/api/v1/remarks?page=1&page_size=10", headers={"Authorization": f"Bearer {token}"})
print(f"Remarks with mock token: {resp.status_code}")
if resp.status_code == 200:
    data = resp.json()
    print(f"Remarks count: {len(data.get('remarks', [])) if isinstance(data, dict) else 'N/A'}")
else:
    print(f"Error: {resp.text[:200]}")

# Check documents
resp = client.get("/api/v1/documents", headers={"Authorization": f"Bearer {token}"})
print(f"\nDocuments with token: {resp.status_code}")
if resp.status_code == 200:
    docs = resp.json()
    print(f"Documents count: {len(docs) if isinstance(docs, list) else docs.get('total', 'N/A')}")
else:
    print(f"Error: {resp.text[:200]}")

# Check archive entries
resp = client.get("/api/v1/archive/entries", headers={"Authorization": f"Bearer {token}"})
print(f"\nArchive entries with token: {resp.status_code}")
if resp.status_code == 200:
    data = resp.json()
    print(f"Archive entries count: {len(data) if isinstance(data, list) else 'N/A'}")
else:
    print(f"Error: {resp.text[:200]}")
