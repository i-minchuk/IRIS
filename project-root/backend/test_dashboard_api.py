
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token

client = TestClient(app)
token = create_access_token(data={'sub': '1'})

# Test projects
resp = client.get('/api/v1/projects', headers={'Authorization': f'Bearer {token}'})
print(f'/projects: {resp.status_code}')
if resp.status_code == 200:
    data = resp.json()
    print(f'  Items: {len(data)}, First: {data[0]["name"] if data else "empty"}')

# Test remarks
resp = client.get('/api/v1/remarks?page=1&page_size=10', headers={'Authorization': f'Bearer {token}'})
print(f'/remarks: {resp.status_code}')
if resp.status_code == 200:
    data = resp.json()
    print(f'  Total: {data.get("total", 0)}, Items: {len(data.get("items", []))}')
