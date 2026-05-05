"""Простой тест API с использованием OAuth2PasswordRequestForm"""
from fastapi.testclient import TestClient
from app.main import app
import json

client = TestClient(app)

# Login using JSON endpoint
login_data = {"email": "admin@iris.local", "password": "admin123"}
response = client.post("/api/v1/auth/login", data=json.dumps(login_data), headers={"Content-Type": "application/json"})
print(f"Login status: {response.status_code}")

if response.status_code == 200:
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Check projects
    projects = client.get("/api/v1/projects", headers=headers)
    print(f"Projects: {projects.status_code} - {len(projects.json())} items")
    if projects.status_code == 200:
        for p in projects.json()[:2]:
            print(f"  - {p.get('name', 'N/A')} ({p.get('status', 'N/A')})")
    
    # Check documents
    docs = client.get("/api/v1/documents", headers=headers)
    print(f"Documents: {docs.status_code} - {len(docs.json())} items")
    if docs.status_code == 200:
        for d in docs.json()[:2]:
            print(f"  - {d.get('number', 'N/A')} ({d.get('status', 'N/A')})")
    
    # Check remarks
    remarks = client.get("/api/v1/remarks", headers=headers)
    print(f"Remarks: {remarks.status_code} - {len(remarks.json())} items")
    if remarks.status_code == 200:
        for r in remarks.json()[:2]:
            print(f"  - {r.get('title', 'N/A')} ({r.get('status', 'N/A')})")
    
    # Check tenders
    tenders = client.get("/api/v1/tenders", headers=headers)
    print(f"Tenders: {tenders.status_code} - {len(tenders.json())} items")
    if tenders.status_code == 200:
        for t in tenders.json()[:2]:
            print(f"  - {t.get('name', 'N/A')} ({t.get('status', 'N/A')})")
else:
    print(f"Login failed: {response.json()}")
