from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token

client = TestClient(app)
token = create_access_token(data={'sub': '1'})

resp = client.get('/api/v1/documents', headers={'Authorization': f'Bearer {token}'})
print(f'Documents Status: {resp.status_code}')
if resp.status_code == 200:
    docs = resp.json()
    print(f'Documents count: {len(docs) if isinstance(docs, list) else docs.get("total", "N/A")}')
else:
    print(f'Error: {resp.text[:300]}')
