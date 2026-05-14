import asyncio
import asyncpg

async def test():
    # Try the production DB container on port 5433
    hosts = [
        ("127.0.0.1", 5433, "iris", "iris_secret_change_me", "iris"),
        ("127.0.0.1", 5432, "iris", "iris_dev_password", "iris_dev"),
        ("172.20.0.2", 5432, "iris", "iris_dev_password", "iris_dev"),
    ]
    for host, port, user, pwd, db in hosts:
        try:
            conn = await asyncpg.connect(
                user=user,
                password=pwd,
                database=db,
                host=host,
                port=port,
                timeout=5
            )
            version = await conn.fetchval("SELECT version()")
            print(f"✅ {host}:{port}/{db} - {version}")
            await conn.close()
            return
        except Exception as e:
            print(f"❌ {host}:{port}/{db} - {type(e).__name__}: {e}")

asyncio.run(test())