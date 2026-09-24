import pytest

@pytest.mark.api
def test_meta_endpoint_returns_mode_and_version(api_client):
    meta = api_client.get_meta()
    assert "mode" in meta
    assert "version" in meta
    assert meta["mode"] in ("demo", "prod")