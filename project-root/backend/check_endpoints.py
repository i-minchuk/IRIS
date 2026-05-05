from fastapi.testclient import TestClient
from app.main import app
import json

client = TestClient(app)
login_data = {'email': 'admin@iris.local', 'password': 'admin123'}
r = client.post('/api/v1/auth/login', data=json.dumps(login_data), headers={'Content-Type': 'application/json'})
token = r.json()['access_token']
headers = {'Authorization': f'Bearer {token}'}

# Check remarks
remarks = client.get('/api/v1/remarks', headers=headers)
print(f"Remarks: {remarks.status_code}")
if remarks.status_code == 200:
    data = remarks.json()
    print(f"  Total: {data.get('total', len(data.get('remarks', [])))}")
    for remark in data.get('remarks', [])[:2]:
        print(f"  - {remark.get('title', 'N/A')} ({remark.get('status', 'N/A')})")
else:
    print(f"  Error: {remarks.text[:100]}")

# Check tenders
tenders = client.get('/api/v1/tenders', headers=headers)
print(f"Tenders: {tenders.status_code}")
if tenders.status_code == 200:
    tenders_data = tenders.json()
    print(f"  Count: {len(tenders_data)}")
    for tender in tenders_data[:2]:
        print(f"  - {tender.get('name', 'N/A')} ({tender.get('status', 'N/A')})")

# Check documents
docs = client.get('/api/v1/documents?project_id=1', headers=headers)
print(f"Documents (project_id=1): {docs.status_code}")
if docs.status_code == 200:
    print(f"  Count: {len(docs.json())}")
