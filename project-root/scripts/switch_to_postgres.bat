@echo off
setlocal enabledelayedexpansion

echo.🔄 Switching to PostgreSQL development environment...

REM Backup SQLite if exists
if exist backend\iris.db (
    for /f "tokens=2-4 delims=/ " %%a in ('date /t') do set mydate=%%c%%a%%b
    for /f "tokens=1-2 delims=: " %%a in ('time /t') do set mytime=%%a%%b
    copy backend\iris.db backend\iris.db.backup.!mydate!_!mytime! > nul
    echo.💾 SQLite backed up
)

REM Start infrastructure
echo.⏳ Starting PostgreSQL and Qdrant...
docker compose -f docker-compose.dev.yml up -d db qdrant

REM Wait for PostgreSQL
echo.⏳ Waiting for PostgreSQL to be ready...
timeout /t 10 /nobreak > nul

REM Copy environment
echo.📝 Copying .env.postgres to .env
copy backend\.env.postgres backend\.env

REM Install asyncpg if not present
echo.📦 Installing asyncpg...
cd backend
pip install asyncpg >nul 2>&1 || echo Warning: pip install failed

REM Run migrations
echo.🔄 Running Alembic migrations...
alembic upgrade head

REM Seed data
echo.🌱 Seeding database...
python -m app.db.seed_all || echo ⚠️ Seed failed, may need manual check

cd ..

echo.
echo.✅ PostgreSQL environment ready!
echo.   Database: iris_dev
echo.   User: iris
echo.   URL: postgresql+asyncpg://iris:iris_dev_password@localhost:5432/iris_dev
echo.
echo.   Start backend: cd backend ^&^& python -m uvicorn app.main:app --reload
echo.   Start frontend: cd frontend ^&^& npm run dev
