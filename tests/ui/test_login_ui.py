import pytest
from tests.common.pages.login_page import LoginPage

@pytest.mark.ui
def test_login_shows_error_on_wrong_credentials(page):
    login = LoginPage(page)
    login.open()
    login.login("admin", "your_password")
    login.assert_error_visible()