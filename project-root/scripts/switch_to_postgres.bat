@echo off
echo Switching to PostgreSQL development environment...

REM Backup SQLite if exists
if exist backend\iris.db (
    copy backend\iris.db backend\iris.db.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
    echo SQLite backed up
)

REM Start infrastructure
docker compose -f docker-compose.dev.yml up -d db qdrant

REM Wait for PostgreSQL
echo Waiting for PostgreSQL to be ready...
timeout /t 8 /nobreak >nul

REM Copy environment
copy backend\.env.postgres backend\.env

REM Install asyncpg if not present
pip install asyncpg 2>nul || echo asyncpg already installed

REM Run migrations
cd backend
alembic upgrade head

REM Seed data
python -m app.db.seed_all || echo Seed failed, may need manual check
cd ..

echo.
echo PostgreSQL environment ready!
echo    Database: iris_dev
echo    User: iris
echo    URL: postgresql+asyncpg://iris:iris_dev_password@localhost:5432/iris_dev
echo.
echo    Start backend: cd backend ^&^& python -m uvicorn app.main:app --reload
echo    Start frontend: cd frontend ^&^& npm run dev