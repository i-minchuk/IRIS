@echo off
echo ============================================
echo    ДОКПОТОК IRIS - ЗАПУСК СИСТЕМЫ
echo ============================================
echo.

echo [1/4] Проверка PostgreSQL...
sc query postgresql-x64-16 | find "RUNNING" >nul
if %errorlevel% neq 0 (
    echo        PostgreSQL не запущен. Запускаем...
    net start postgresql-x64-16
    if %errorlevel% neq 0 (
        echo        ОШИБКА: Не удалось запустить PostgreSQL!
        echo        Запустите вручную: services.msc -> PostgreSQL -> Запустить
        pause
        exit /b 1
    )
    echo        PostgreSQL запущен
    timeout /t 3 /nobreak >nul
) else (
    echo        PostgreSQL уже работает
)

echo.
echo [2/4] Запуск Backend (порт 8000)...
start "Backend API" powershell -NoExit -Command "cd C:\Users\Novikova\Desktop\ДокПоток_IRIS\project-root\backend; .\.venv\Scripts\Activate.ps1; python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
timeout /t 2 /nobreak >nul

echo [3/4] Запуск Frontend (порт 5173)...
start "Frontend" powershell -NoExit -Command "cd C:\Users\Novikova\Desktop\ДокПоток_IRIS\project-root\frontend; npm run dev"
timeout /t 3 /nobreak >nul

echo [4/4] Открытие браузера...
start http://localhost:5173

echo.
echo ============================================
echo    СИСТЕМА ЗАПУЩЕНА!
echo ============================================
echo.
echo    Frontend:  http://localhost:5173
echo    Backend:   http://localhost:8000
echo    API Docs:  http://localhost:8000/docs
echo.
echo    Вход:
echo       Email: admin@iris.local
echo       Пароль: admin123
echo.
echo    Не закрывайте окна PowerShell!
echo       Это серверы системы.
echo.
echo ============================================
pause