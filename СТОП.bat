@echo off
echo ============================================
echo    „’ IRIS - ‘’€‚€
echo ============================================
echo.

echo [1/3] αβ ­®Άª  Frontend...
taskkill /F /IM node.exe >nul 2>&1
echo        Frontend ®αβ ­®Ά«¥­

echo.
echo [2/3] αβ ­®Άª  Backend...
taskkill /F /IM python.exe >nul 2>&1
echo        Backend ®αβ ­®Ά«¥­

echo.
echo [3/3] αβ ­®Άª  PostgreSQL...
net stop postgresql-x64-16 >nul 2>&1
echo        PostgreSQL ®αβ ­®Ά«¥­

echo.
echo ============================================
echo    ‚‘… ‘…‚‘› ‘’€‚‹…›
echo ============================================
pause