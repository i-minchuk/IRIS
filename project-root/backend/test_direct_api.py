"""Direct API test with token"""
import requests
import sys
sys.path.insert(0, '.')

from app.core.security import create_access_token

# Create token for user 1
token = create_access_token(data={"sub": "1"})
print(f"Token created: {token[:30]}...")

# Test API endpoint directly
headers = {"Authorization": f"Bearer {token}"}

# Test remarks
print("\n--- Testing /api/v1/remarks ---")
try:
    resp = requests.get("http://localhost:8000/api/v1/remarks?page=1&page_size=10", headers=headers, timeout=10)
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        print(f"Remarks count: {len(data.get('remarks', [])) if isinstance(data, dict) else 'N/A'}")
        if isinstance(data, dict) and 'remarks' in data and data['remarks']:
            print(f"First remark: {data['remarks'][0].get('title', 'N/A')}")
    else:
        print(f"Error: {resp.text[:300]}")
except Exception as e:
    print(f"Exception: {e}")

# Test documents
print("\n--- Testing /api/v1/documents ---")
try:
    resp = requests.get("http://localhost:8000/api/v1/documents", headers=headers, timeout=10)
    print(f"Status: {resp.status_code}")
    if resp.status_code == 200:
        docs = resp.json()
        print(f"Documents count: {len(docs) if isinstance(docs, list) else docs.get('total', 'N/A')}")
    else:
        print(f"Error: {resp.text[:300]}")
except Exception as e:
    print(f"Exception: {e}")
