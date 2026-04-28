#!/usr/bin/env python
"""Seed database with initial test data."""

import asyncio
import logging
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import AsyncSessionLocal
from app.modules.auth.schemas import UserCreate
from app.modules.auth.repository import UserRepository
from app.modules.projects.repository import ProjectRepository

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def create_test_user(db: AsyncSession) -> None:
    """Create test user if not exists."""
    repo = UserRepository(db)
    
    # Check if user exists
    existing = await repo.get_by_email("admin@iris.com")
    if existing:
        logger.info("User admin@iris.com already exists")
        return
    
    # Create user
    user_data = UserCreate(
        email="admin@iris.com",
        username="admin",
        password="admin123",
        full_name="Admin User",
        is_active=True,
    )
    
    user = await repo.create(user_data)
    logger.info(f"Created test user: {user.email} (username: {user.username})")


async def create_test_projects(db: AsyncSession) -> None:
    """Create test projects if not exists."""
    repo = ProjectRepository(db)
    
    # Check if any projects exist
    result = await db.execute(select(repo.model))
    existing_projects = result.scalars().all()
    
    if existing_projects:
        logger.info(f"{len(existing_projects)} projects already exist")
        return
    
    # Create test projects directly using repository
    projects_data = [
        {
            "name": "Тестовый проект TP-001",
            "code": "TP-001",
            "customer_name": "ООО Тестовая Компания",
            "contract_number": None,
            "stage": "Эскизный",
            "status": "active",
            "risk_level": "low",
        },
        {
            "name": "Проект разработки ИИ-ассистента",
            "code": "AI-2024",
            "customer_name": "Внутренний проект",
            "contract_number": None,
            "stage": "Технический",
            "status": "active",
            "risk_level": "medium",
        },
        {
            "name": "Система управления документами",
            "code": "DMS-001",
            "customer_name": "Госкорпорация",
            "contract_number": "ГК-2024-123",
            "stage": "Рабочий",
            "status": "active",
            "risk_level": "high",
        },
    ]
    
    for project_data in projects_data:
        project = await repo.create(project_data)
        logger.info(f"Created project: {project.code} - {project.name}")


async def main() -> None:
    """Main seed function."""
    logger.info("Starting database seeding...")
    
    async with AsyncSessionLocal() as db:
        # Create test user
        await create_test_user(db)
        
        # Create test projects
        await create_test_projects(db)
    
    logger.info("Database seeding completed!")
    logger.info("\nTest credentials:")
    logger.info("  Email: admin@iris.com")
    logger.info("  Username: admin")
    logger.info("  Password: admin123")


if __name__ == "__main__":
    asyncio.run(main())
