"""Test PostgreSQL connection"""
import asyncio
import sys
sys.stdout.reconfigure(encoding='utf-8')

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

DATABASE_URL = "postgresql+asyncpg://iris:iris_dev_password@localhost:5432/iris_dev"

async def test_connection():
    engine = create_async_engine(DATABASE_URL, echo=False)
    
    try:
        async with engine.connect() as conn:
            result = await conn.execute("SELECT version()")
            version = result.scalar()
            print(f"\n[OK] PostgreSQL connected!")
            print(f"   Version: {version}")
            print(f"   Database: iris_dev")
            print(f"   URL: {DATABASE_URL}")
            return True
    except Exception as e:
        print(f"\n[ERROR] Connection failed: {e}")
        return False
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(test_connection())
