@echo off
chcp 1251 >nul
title DokPotok IRIS - Stop
color 0C

echo.
echo ============================================
echo    DokPotok IRIS - Stop System
echo ============================================
echo.

echo [1/3] Stopping Backend...
taskkill /F /IM python.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo    OK: Backend stopped
) else (
    echo    INFO: Backend was not running
)

echo.
echo [2/3] Stopping Frontend...
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo    OK: Frontend stopped
) else (
    echo    INFO: Frontend was not running
)

echo.
echo [3/3] Checking ports...
netstat -ano | findstr ":8000.*LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000.*LISTENING"') do (
        taskkill /F /PID %%a >nul 2>&1
        echo    OK: Port 8000 freed (PID %%a)
    )
) else (
    echo    OK: Port 8000 is free
)

echo.
echo ============================================
echo    System stopped
echo ============================================
echo.
pause
