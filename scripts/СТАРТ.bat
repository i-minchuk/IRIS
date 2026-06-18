@echo off
chcp 1251 >nul
title DokPotok IRIS - Start
color 0B

set "PROJECT_ROOT=%~dp0project-root"
set "BACKEND_DIR=%PROJECT_ROOT%\backend"
set "FRONTEND_DIR=%PROJECT_ROOT%\frontend"
set "VENV_PYTHON=%BACKEND_DIR%\.venv\Scripts\python.exe"

echo.
echo ============================================
echo    DokPotok IRIS - Start System
echo ============================================
echo.

echo [1/5] Checking environment...
if not exist "%VENV_PYTHON%" (
    echo    ERROR: Python venv not found
    echo    Path: %VENV_PYTHON%
    pause
    exit /b 1
)
echo    OK: Python venv found

echo.
echo [2/5] Stopping old processes...
taskkill /F /IM python.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
ping -n 4 127.0.0.1 >nul
echo    OK: Old processes stopped

echo.
echo [3/5] Starting Backend (port 8000)...
start "DokPotok IRIS - Backend" /D "%BACKEND_DIR%" cmd /k ""%VENV_PYTHON%" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
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
echo    System is running!
echo ============================================
echo.
echo    Frontend:  http://localhost:5173
echo    Backend:   http://localhost:8000
echo    API Docs:  http://localhost:8000/docs
echo.
echo    Login:    admin
echo    Password: admin123
echo.
echo    Do not close Backend and Frontend windows!
echo.
echo ============================================
pause
