import pytest
from playwright.sync_api import Page
from tests.common.pages.login_page import LoginPage
from tests.common.config import DEMO_LOGIN, DEMO_PASSWORD

@pytest.fixture(scope="session")
def browser_context_args(browser_context_args):
    return {**browser_context_args, "viewport": {"width": 1600, "height": 1200}}

@pytest.fixture
def logged_in_page(page: Page):
    login_page = LoginPage(page)
    login_page.open()
    login_page.login(DEMO_LOGIN, DEMO_PASSWORD)
    return page