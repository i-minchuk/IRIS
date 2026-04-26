"""
Quick setup script for development.
Creates SQLite database and test user.
"""

import asyncio
import sys
import os
from pathlib import Path

# Set UTF-8 encoding for Windows
os.environ['PYTHONIOENCODING'] = 'utf-8'

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import text
from app.db.base import Base
from app.db.session import AsyncSessionLocal, engine
from app.modules.auth.repository import UserRepository
from app.modules.auth.schemas import UserCreate


async def setup():
    """Initialize database and create test user."""
    print("=" * 50)
    print("SETUP: DokPotok IRIS for development")
    print("=" * 50)
    
    try:
        # Step 1: Create tables
        print("\n[1/3] Creating database tables...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("OK: Tables created successfully!")
        
        # Step 2: Check existing users
        print("\n[2/3] Checking existing users...")
        async with AsyncSessionLocal() as session:
            repo = UserRepository(session)
            all_users = await repo.get_all()
            
            if all_users:
                print(f"   Found {len(all_users)} existing user(s):")
                for user in all_users:
                    print(f"   - {user.email} ({user.username or 'no username'})")
            else:
                # Step 3: Create test user
                print("\n[3/3] Creating test user...")
                test_user = await repo.create(UserCreate(
                    email='test@example.com',
                    username='testuser',
                    password='test123',
                    full_name='Test User'
                ))
                print("OK: Test user created!")
                print(f"   Email: test@example.com")
                print(f"   Username: testuser")
                print(f"   Password: test123")
        
        print("\n" + "=" * 50)
        print("SETUP COMPLETE! You can now login:")
        print("=" * 50)
        print("\nFrontend: http://localhost:5173")
        print("Backend:  http://localhost:8000")
        print("\nLogin credentials:")
        print("   Option 1 - Email: test@example.com")
        print("   Option 2 - Username: testuser")
        print("   Password: test123")
        print("=" * 50)
        
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True


if __name__ == "__main__":
    success = asyncio.run(setup())
    if not success:
        exit(1)
