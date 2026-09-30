"""Очистить production-таблицы и заново загрузить базовый процесс из seed.py."""
import asyncio

from sqlalchemy import delete, select

from app.db.session import AsyncSessionLocal
from app.modules.auth.models import User
from app.modules.production.models import (
    ProdDepartment,
    ProdEmployee,
    ProdProcessEdge,
    ProdProcessNode,
    ProdProblem,
)
from app.modules.production.router import seed_strategy


async def main() -> None:
    async with AsyncSessionLocal() as db:
        for model in [ProdProcessEdge, ProdProcessNode, ProdProblem, ProdEmployee, ProdDepartment]:
            await db.execute(delete(model))
        await db.commit()

        user = (await db.execute(select(User).limit(1))).scalar_one_or_none()
        if user is None:
            raise RuntimeError("No user found; cannot seed production data")

        await seed_strategy(db, user)
        print("Production data reset and seeded successfully")


if __name__ == "__main__":
    asyncio.run(main())
