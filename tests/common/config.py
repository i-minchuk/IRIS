import os
from dotenv import load_dotenv

load_dotenv()

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
DEMO_LOGIN = os.getenv("DEMO_LOGIN", "admin")
DEMO_PASSWORD = os.getenv("DEMO_PASSWORD", "")
HEADLESS = os.getenv("HEADLESS", "1") == "1"
SLOW_MO = int(os.getenv("SLOW_MO", "0"))