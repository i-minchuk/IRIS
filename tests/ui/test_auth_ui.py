import pytest
from tests.common.pages.dashboard_page import DashboardPage

@pytest.mark.ui
def test_login_to_dashboard(logged_in_page):
    DashboardPage(logged_in_page).wait_loaded()