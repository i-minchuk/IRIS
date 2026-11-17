if "%~1"=="_demo_backend_loop" goto _demo_backend_loop

:begin
@echo off
chcp 65001 >nul
title DokPotok IRIS - Start DEMO
color 0A

set "PROJECT_ROOT=%~dp0.."
set "BACKEND_DIR=%PROJECT_ROOT%\project-root\backend"
set "FRONTEND_DIR=%PROJECT_ROOT%\project-root\frontend"
set "VENV_PYTHON=%BACKEND_DIR%\.venv\Scripts\python.exe"

echo.
echo ============================================
echo    DokPotok IRIS v4.9.1 - Start System (DEMO MODE)
echo ============================================
echo.

echo [1/5] Checking environment...
if not exist "%VENV_PYTHON%" (
    echo    ERROR: Python venv not found
    echo    Path: %VENV_PYTHON%
    echo.
    echo    Run first:
    echo      cd project-root\backend
    echo      python -m venv .venv
    echo      .venv\Scripts\activate.bat
    echo      pip install -r requirements.txt
    echo.
    pause
    exit /b 1
)
echo    OK: Python venv found

echo.
echo [2/5] Stopping old processes on ports 8000 and 5173...
call "%~dp0СТОП.bat" --silent >nul 2>&1
echo    OK: Ports freed

echo.
echo [3/5] Starting Backend Watcher in DEMO mode (port 8000)...
start "DokPotok IRIS - Backend Watcher (DEMO)" /D "%~dp0" cmd /k "\"%~f0\" _demo_backend_loop \"%VENV_PYTHON%\" \"%BACKEND_DIR%\""
ping -n 6 127.0.0.1 >nul

curl -s --max-time 5 http://localhost:8000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo    OK: Backend is running
) else (
    echo    WAIT: Backend is starting...
    ping -n 5 127.0.0.1 >nul
)

echo.
echo [4/5] Starting Frontend (port 5173)...
start "DokPotok IRIS - Frontend" /D "%FRONTEND_DIR%" cmd /k "npm run dev"
ping -n 6 127.0.0.1 >nul
echo    OK: Frontend started

echo.
echo [5/5] Opening browser...
start http://localhost:5173
echo    OK: Browser opened

echo.
echo ============================================
echo    System is running in DEMO MODE!
echo    All data is fictional. Exports and
    external integrations are disabled.
echo ============================================
echo.
echo    Frontend:  http://localhost:5173
echo    Backend:   http://localhost:8000
echo    API Docs:  http://localhost:8000/docs
echo.
echo    Demo login:    demo@iris.local
echo    Demo password: demo1234
echo.
echo    IMPORTANT:
echo    - Do not close Backend Watcher and Frontend windows!
echo    - Backend Watcher will auto-restart backend if it crashes.
echo.
echo ============================================
pause
goto :eof

:_demo_backend_loop
@echo off
chcp 65001 >nul
title DokPotok IRIS - Backend Watcher (DEMO)
color 0A

set "VENV_PYTHON=%~2"
set "BACKEND_DIR=%~3"

if not exist "%VENV_PYTHON%" (
    echo ERROR: Python venv not found
    echo Path: %VENV_PYTHON%
    pause
    exit /b 1
)

cd /d "%BACKEND_DIR%"

:loop
echo.
echo [%date% %time%] Starting backend in DEMO mode on port 8000...
echo.
set MODE=demo
set DATABASE_URL=sqlite+aiosqlite:///./demo.db
"%VENV_PYTHON%" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
set "UVICORN_EXIT=%errorlevel%"

if %UVICORN_EXIT% equ 0 (
    echo.
    echo [%date% %time%] Backend stopped normally.
    echo Press any key to close this window.
    pause >nul
    exit /b 0
)

echo.
echo [%date% %time%] Backend exited with code %UVICORN_EXIT%. Restarting in 3 seconds...
echo.
timeout /t 3 /nobreak >nul
goto loop
