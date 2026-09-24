from playwright.sync_api import Page, expect
from tests.common.config import FRONTEND_URL

class LoginPage:
    def __init__(self, page: Page):
        self.page = page

    def open(self):
        self.page.goto(f"{FRONTEND_URL}/login")

    def login(self, login: str, password: str):
        self.page.get_by_label("Логин").fill(login)
        self.page.get_by_label("Пароль").fill(password)
        self.page.get_by_role("button", name="Войти").click()

    def assert_error_visible(self):
        expect(self.page.get_by_text("Incorrect email/username or password")).to_be_visible()