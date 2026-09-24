from pathlib import Path

def pytest_sessionfinish(session, exitstatus):
    Path("reports").mkdir(exist_ok=True)