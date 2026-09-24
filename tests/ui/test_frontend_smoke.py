import pytest

@pytest.mark.ui
def test_frontend_root_opens(page):
    page.goto("http://localhost:5173")
    assert page.title() is not None