# API check script
import requests
import json

BASE_URL = "http://localhost:8000"

# Step 1: Login
print("=" * 50)
print("Step 1: Login")
print("=" * 50)

login_data = {
    "username": "admin@iris.local",
    "password": "admin123"
}

try:
    resp = requests.post(f"{BASE_URL}/api/v1/auth/login", json=login_data)
    print(f"Login status: {resp.status_code}")
    
    if resp.status_code == 200:
        token = resp.json()["access_token"]
        print(f"Token obtained: {token[:20]}...")
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Step 2: Check Projects
        print("\n" + "=" * 50)
        print("Step 2: Check Projects")
        print("=" * 50)
        resp = requests.get(f"{BASE_URL}/api/v1/projects", headers=headers)
        print(f"Projects status: {resp.status_code}")
        if resp.status_code == 200:
            projects = resp.json()
            print(f"Projects count: {len(projects) if isinstance(projects, list) else projects.get('total', 'N/A')}")
            if isinstance(projects, list) and projects:
                print(f"First project: {projects[0].get('name', 'N/A')}")
        
        # Step 3: Check Documents
        print("\n" + "=" * 50)
        print("Step 3: Check Documents")
        print("=" * 50)
        resp = requests.get(f"{BASE_URL}/api/v1/documents", headers=headers)
        print(f"Documents status: {resp.status_code}")
        if resp.status_code == 200:
            docs = resp.json()
            print(f"Documents count: {len(docs) if isinstance(docs, list) else docs.get('total', 'N/A')}")
            if isinstance(docs, list) and docs:
                print(f"First document: {docs[0].get('name', 'N/A')}")
        elif resp.status_code == 401:
            print("ERROR: Unauthorized - token may be invalid")
        elif resp.status_code == 500:
            print(f"ERROR: Server error - {resp.text[:200]}")
        
        # Step 4: Check Remarks
        print("\n" + "=" * 50)
        print("Step 4: Check Remarks")
        print("=" * 50)
        resp = requests.get(f"{BASE_URL}/api/v1/remarks", headers=headers)
        print(f"Remarks status: {resp.status_code}")
        if resp.status_code == 200:
            remarks = resp.json()
            print(f"Remarks count: {len(remarks.get('remarks', [])) if isinstance(remarks, dict) else len(remarks) if isinstance(remarks, list) else 'N/A'}")
            if isinstance(remarks, dict) and 'remarks' in remarks:
                if remarks['remarks']:
                    print(f"First remark: {remarks['remarks'][0].get('title', 'N/A')}")
        elif resp.status_code == 401:
            print("ERROR: Unauthorized - token may be invalid")
        elif resp.status_code == 500:
            print(f"ERROR: Server error - {resp.text[:300]}")
            import traceback
            traceback.print_exc()
        
        # Step 5: Check Remarks without pagination
        print("\n" + "=" * 50)
        print("Step 5: Check Remarks (unpaginated)")
        print("=" * 50)
        resp = requests.get(f"{BASE_URL}/api/v1/remarks?page=1&page_size=100", headers=headers)
        print(f"Remarks status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            print(f"Response type: {type(data).__name__}")
            if isinstance(data, dict):
                print(f"Keys: {list(data.keys())}")
                print(f"Total: {data.get('total', 'N/A')}")
                print(f"Remarks: {len(data.get('remarks', []))}")
        
    else:
        print(f"Login failed: {resp.text}")
        
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
