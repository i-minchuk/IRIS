import asyncio
from app.db.session import AsyncSessionLocal
from sqlalchemy import text

async def fix():
    async with AsyncSessionLocal() as db:
        new_hash = '$2b$12$TrfP8DPTC9JnwKvnKKepw.anLaPEVRCgBdRYm.OXOHPLRnCw4d.eK'
        print('Hash length:', len(new_hash))
        print('Hash:', new_hash)
        await db.execute(
            text('UPDATE users SET hashed_password = :h WHERE email = :e'),
            {'h': new_hash, 'e': 'admin@iris.local'}
        )
        await db.commit()
        result = await db.execute(
            text('SELECT hashed_password FROM users WHERE email = :e'),
            {'e': 'admin@iris.local'}
        )
        val = result.scalar()
        print('DB value length:', len(val))
        print('DB value:', val)

asyncio.run(fix())
