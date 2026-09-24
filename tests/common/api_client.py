import requests
from .config import BACKEND_URL

class IrisApiClient:
    def __init__(self, base_url: str = BACKEND_URL):
        self.base_url = base_url.rstrip("/")
        self.session = requests.Session()

    def get_meta(self):
        r = self.session.get(f"{self.base_url}/api/v1/meta", timeout=15)
        r.raise_for_status()
        return r.json()