import pytest
from ..common.api_client import IrisApiClient

@pytest.fixture(scope="session")
def api_client():
    return IrisApiClient()

