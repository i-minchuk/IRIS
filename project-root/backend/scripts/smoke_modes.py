"""Smoke-проверка запущенного backend в режиме demo или prod.

Использование:
    python scripts/smoke_modes.py --base-url http://127.0.0.1:8010 --mode demo
    python scripts/smoke_modes.py --base-url http://127.0.0.1:8011 --mode prod

Проверяет: /health, /api/v1/meta (режим), логин, ключевые эндпоинты,
а в demo — что экспорт замечаний заблокирован (403).
Код выхода 0 — все проверки прошли, 1 — есть ошибки.
"""

from __future__ import annotations

import argparse
import sys
import uuid

import httpx

DEMO_EMAIL = "demo@iris.local"
DEMO_PASSWORD = "demo1234"

results: list[tuple[str, bool, str]] = []


def check(name: str, ok: bool, detail: str = "") -> None:
    results.append((name, ok, detail))
    mark = "OK " if ok else "FAIL"
    print(f"[{mark}] {name}" + (f" — {detail}" if detail else ""))


def main() -> int:
    parser = argparse.ArgumentParser(description="Smoke-проверка режимов IRIS")
    parser.add_argument("--base-url", default="http://127.0.0.1:8000")
    parser.add_argument("--mode", choices=["demo", "prod"], required=True)
    parser.add_argument("--email", default=None, help="Email для логина (prod)")
    parser.add_argument("--password", default=None, help="Пароль для логина (prod)")
    args = parser.parse_args()

    base = args.base_url.rstrip("/")
    client = httpx.Client(base_url=base, timeout=15.0)

    # 1. Health
    try:
        r = client.get("/health")
        check("GET /health", r.status_code == 200, f"status={r.status_code}")
    except httpx.HTTPError as exc:
        check("GET /health", False, str(exc))
        print("\nСервер недоступен — дальнейшие проверки невозможны.")
        return 1

    # 2. Meta: режим и фичи
    r = client.get("/api/v1/meta")
    meta = r.json() if r.status_code == 200 else {}
    check(
        "GET /api/v1/meta",
        r.status_code == 200 and meta.get("mode") == args.mode,
        f"status={r.status_code} mode={meta.get('mode')!r}",
    )
    features = meta.get("features", {})
    if args.mode == "demo":
        check("demo: exports выключены", features.get("exports") is False, str(features))
        check("demo: баннер включён", features.get("demo_banner") is True, str(features))
    else:
        check("prod: exports включены", features.get("exports") is True, str(features))
        check("prod: фидбек включён", features.get("feedback_button") is True, str(features))

    # 3. Логин
    if args.mode == "demo":
        email, password = DEMO_EMAIL, DEMO_PASSWORD
    else:
        email = args.email or f"smoke_{uuid.uuid4().hex[:8]}@iris.local"
        password = args.password or "smoke12345"
        if not args.email:
            reg = client.post(
                "/api/v1/auth/register",
                json={
                    "email": email,
                    "username": email.split("@")[0],
                    "password": password,
                    "full_name": "Smoke Test",
                },
            )
            check("prod: регистрация smoke-пользователя", reg.status_code in (200, 201), f"status={reg.status_code}")

    r = client.post(
        "/api/v1/auth/login?response_type=json",
        json={"email": email, "password": password},
    )
    token = r.json().get("access_token") if r.status_code == 200 else None
    check("POST /auth/login", r.status_code == 200 and bool(token), f"status={r.status_code}")
    if not token:
        print("\nНет токена — дальнейшие проверки невозможны.")
        return 1
    client.headers["Authorization"] = f"Bearer {token}"

    # 4. Текущий пользователь
    r = client.get("/api/v1/auth/me")
    check("GET /auth/me", r.status_code == 200, f"status={r.status_code}")

    # 5. Ключевые эндпоинты дашборда
    for path in ("/api/v1/projects", "/api/v1/documents", "/api/v1/remarks"):
        r = client.get(path)
        check(f"GET {path}", r.status_code == 200, f"status={r.status_code}")

    # 6. Гейтинг экспорта в demo
    r = client.get("/api/v1/remarks/export")
    if args.mode == "demo":
        check("demo: /remarks/export заблокирован", r.status_code == 403, f"status={r.status_code}")
    else:
        check("prod: /remarks/export доступен", r.status_code == 200, f"status={r.status_code}")

    failed = [n for n, ok, _ in results if not ok]
    print(f"\nИтого: {len(results) - len(failed)}/{len(results)} проверок прошло.")
    if failed:
        print("Провалы: " + ", ".join(failed))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
