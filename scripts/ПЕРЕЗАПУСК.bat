@echo off
chcp 1251 >nul
title DokPotok IRIS - Restart
color 0E

echo.
echo ============================================
echo    DokPotok IRIS - Restart System
echo ============================================
echo.

call "%~dp0СТОП.bat" >nul 2>&1
ping -n 3 127.0.0.1 >nul
call "%~dp0СТАРТ.bat"
