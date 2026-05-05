import asyncio
import asyncpg

async def test():
    try:
        conn = await asyncpg.connect(
            user="iris",
            password="iris_dev_password",
            database="iris_dev",
            host="localhost",
            port=5432
        )
        await conn.close()
        print("✅ PostgreSQL connection OK")
    except Exception as e:
        print(f"❌ PostgreSQL connection failed: {e}")

asyncio.run(test())