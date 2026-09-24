from playwright.sync_api import Page, expect

class DashboardPage:
    def __init__(self, page: Page):
        self.page = page

    def wait_loaded(self):
        expect(self.page).to_have_url("http://localhost:5173/dashboard")
        expect(self.page.get_by_role("heading", name="Панель аналитики", level=1)).to_be_visible()
        expect(self.page.get_by_role("button", name="Администратор")).to_be_visible()

    def open_section(self, name: str):
        url_map = {
            "Панель аналитики": "/dashboard",
            "Портфель заказов": "/portfolio",
            "Документация": "/documents",
            "Производственный контроль": "/production",
            "Архив": "/archive",
            "Администрирование": "/admin",
            "Справочники": "/references",
            "Отчёты": "/reports",
        }
        href = url_map[name]
        self.page.locator(f"a[href='{href}']").first.click()