#!/bin/bash
set -e

echo "🔄 Switching to PostgreSQL development environment..."

# Backup SQLite if exists
if [ -f backend/iris.db ]; then
    cp backend/iris.db backend/iris.db.backup.$(date +%Y%m%d_%H%M%S)
    echo "💾 SQLite backed up"
fi

# Start infrastructure
docker compose -f docker-compose.dev.yml up -d db qdrant

# Wait for PostgreSQL
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 8

# Copy environment
cp backend/.env.postgres backend/.env

# Install asyncpg if not present
cd backend
pip install asyncpg || true

# Run migrations
alembic upgrade head

# Seed data
python -m app.db.seed_all || echo "⚠️ Seed failed, may need manual check"

echo ""
echo "✅ PostgreSQL environment ready!"
echo "   Database: iris_dev"
echo "   User: iris"
echo "   URL: postgresql+asyncpg://iris:iris_dev_password@localhost:5432/iris_dev"
echo ""
echo "   Start backend: cd backend && python -m uvicorn app.main:app --reload"
echo "   Start frontend: cd frontend && npm run dev"
