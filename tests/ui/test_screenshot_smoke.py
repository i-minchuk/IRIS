import pytest

@pytest.mark.ui
def test_dashboard_screenshot(logged_in_page):
    logged_in_page.screenshot(path="reports/dashboard.png", full_page=True)
    assert True