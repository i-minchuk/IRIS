import pytest
from playwright.sync_api import expect
from tests.common.pages.dashboard_page import DashboardPage

SECTIONS = [
    ("Панель аналитики", "http://localhost:5173/dashboard", "Панель аналитики"),
    ("Портфель заказов", "http://localhost:5173/portfolio", "Портфель"),
    ("Документация", "http://localhost:5173/documents", "Документы"),
    ("Производственный контроль", "http://localhost:5173/production", "Пр-во"),
    ("Архив", "http://localhost:5173/archive", "Архив"),
    ("Администрирование", "http://localhost:5173/admin", "Админ"),
    ("Справочники", "http://localhost:5173/references", "Справочн."),
    ("Отчёты", "http://localhost:5173/reports", "Отчёты"),
]

@pytest.mark.ui
@pytest.mark.parametrize("menu_name,expected_url,expected_text", SECTIONS, ids=[x[0] for x in SECTIONS])
def test_section_content(logged_in_page, menu_name, expected_url, expected_text):
    dashboard = DashboardPage(logged_in_page)
    dashboard.wait_loaded()
    
    # Отладка: лог ссылок
    links = logged_in_page.locator("nav a").all()
    for link in links:
        href = link.get_attribute("href")
        text = link.inner_text()
        print(f"Menu link: {text} -> {href}")
    
    dashboard.open_section(menu_name)
    expect(logged_in_page).to_have_url(expected_url)
    expect(logged_in_page.get_by_role("heading", name=expected_text)).to_be_visible()