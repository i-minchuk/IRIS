:begin
@echo off
chcp 65001 >nul
title DokPotok IRIS - Stop
color 0C

set "SILENT=0"
if "%~1"=="--silent" set "SILENT=1"

if %SILENT% equ 0 (
    echo.
    echo ============================================
    echo    DokPotok IRIS v4.9.1 - Stop System
    echo ============================================
    echo.
)

echo [1/2] Checking port 8000...
netstat -ano | findstr ":8000.*LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000.*LISTENING"') do (
        taskkill /F /PID %%a >nul 2>&1
        if %SILENT% equ 0 echo    OK: Port 8000 freed (PID %%a)
    )
) else (
    if %SILENT% equ 0 echo    OK: Port 8000 is free
)

echo.
echo [2/2] Checking port 5173...
netstat -ano | findstr ":5173.*LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173.*LISTENING"') do (
        taskkill /F /PID %%a >nul 2>&1
        if %SILENT% equ 0 echo    OK: Port 5173 freed (PID %%a)
    )
) else (
    if %SILENT% equ 0 echo    OK: Port 5173 is free
)

if %SILENT% equ 0 (
    echo.
    echo ============================================
    echo    System stopped
    echo ============================================
    echo.
    pause
)
