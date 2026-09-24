"""API производственного процесса (вкладка «Стратегия»): схема, отделы, сотрудники, проблемы."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.auth.deps import get_current_active_user
from app.modules.auth.models import User
from app.modules.production import seed as seed_data
from app.modules.production.analytics import enrich_strategy
from app.modules.production.models import (
    ProdDepartment,
    ProdEmployee,
    ProdProcessEdge,
    ProdProcessNode,
    ProdProblem,
)
from app.modules.production.schemas import (
    DepartmentCreate,
    DepartmentResponse,
    DepartmentUpdate,
    EdgeCreate,
    EdgeResponse,
    EdgeUpdate,
    EmployeeCreate,
    EmployeeResponse,
    EmployeeUpdate,
    NodeCreate,
    NodeResponse,
    NodeUpdate,
    ProblemCreate,
    ProblemResponse,
    ProblemUpdate,
    StrategyResponse,
)

router = APIRouter(tags=["production"])


async def _list(db: AsyncSession, model):
    result = await db.execute(select(model).order_by(model.position))
    return list(result.scalars().all())


async def _get_or_404(db: AsyncSession, model, obj_id: str, detail: str):
    result = await db.execute(select(model).where(model.__table__.c[0] == obj_id))
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail=detail)
    return obj


def _apply_update(obj, data) -> None:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)


async def _departments_with_employees(db: AsyncSession) -> list[DepartmentResponse]:
    departments = await _list(db, ProdDepartment)
    employees = await _list(db, ProdEmployee)
    by_dept: dict[str, list[str]] = {}
    for emp in employees:
        by_dept.setdefault(emp.dept_key, []).append(emp.id)
    return [
        DepartmentResponse.model_validate(d).model_copy(
            update={"employees": by_dept.get(d.key, [])}
        )
        for d in departments
    ]


# ---------- Aggregated strategy ----------


@router.get("/strategy", response_model=StrategyResponse)
async def get_strategy(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    employees = await _list(db, ProdEmployee)
    nodes = await _list(db, ProdProcessNode)
    strategy = StrategyResponse(
        departments=await _departments_with_employees(db),
        employees=[EmployeeResponse.model_validate(e) for e in employees],
        nodes=[NodeResponse.model_validate(n) for n in nodes],
        edges=[EdgeResponse.model_validate(e) for e in await _list(db, ProdProcessEdge)],
        problems=[ProblemResponse.model_validate(p) for p in await _list(db, ProdProblem)],
    )
    # Пустые KPI/загрузка заполняются реальными данными (time tracking,
    # тендеры, замечания, операции) — без сохранения в БД.
    return await enrich_strategy(db, strategy, employees)


@router.post("/strategy/seed", response_model=StrategyResponse)
async def seed_strategy(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Заполняет таблицы базовым процессом, если они пусты (идемпотентно)."""
    existing = await db.execute(select(ProdDepartment).limit(1))
    if existing.scalar_one_or_none() is not None:
        return await get_strategy(db, current_user)

    for data in seed_data.DEPARTMENTS:
        db.add(ProdDepartment(**data))
    for data in seed_data.EMPLOYEES:
        db.add(ProdEmployee(**data))
    for data in seed_data.NODES:
        db.add(ProdProcessNode(**data))
    for data in seed_data.EDGES:
        db.add(ProdProcessEdge(**data))
    for data in seed_data.PROBLEMS:
        db.add(ProdProblem(**data))
    await db.commit()
    return await get_strategy(db, current_user)


# ---------- Departments ----------


@router.post("/departments", response_model=DepartmentResponse, status_code=201)
async def create_department(
    data: DepartmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    obj = ProdDepartment(**data.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return DepartmentResponse.model_validate(obj)


@router.patch("/departments/{key}", response_model=DepartmentResponse)
async def update_department(
    key: str,
    data: DepartmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    obj = await _get_or_404(db, ProdDepartment, key, "Отдел не найден")
    _apply_update(obj, data)
    await db.commit()
    await db.refresh(obj)
    return DepartmentResponse.model_validate(obj)


@router.delete("/departments/{key}", status_code=204)
async def delete_department(
    key: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    obj = await _get_or_404(db, ProdDepartment, key, "Отдел не найден")
    await db.delete(obj)
    await db.commit()


# ---------- Employees ----------


@router.post("/employees", response_model=EmployeeResponse, status_code=201)
async def create_employee(
    data: EmployeeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    obj = ProdEmployee(**data.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.patch("/employees/{emp_id}", response_model=EmployeeResponse)
async def update_employee(
    emp_id: str,
    data: EmployeeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    obj = await _get_or_404(db, ProdEmployee, emp_id, "Сотрудник не найден")
    _apply_update(obj, data)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/employees/{emp_id}", status_code=204)
async def delete_employee(
    emp_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    obj = await _get_or_404(db, ProdEmployee, emp_id, "Сотрудник не найден")
    await db.delete(obj)
    await db.commit()


# ---------- Process nodes ----------


@router.post("/nodes", response_model=NodeResponse, status_code=201)
async def create_node(
    data: NodeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    obj = ProdProcessNode(**data.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.patch("/nodes/{node_id}", response_model=NodeResponse)
async def update_node(
    node_id: str,
    data: NodeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    obj = await _get_or_404(db, ProdProcessNode, node_id, "Узел не найден")
    _apply_update(obj, data)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/nodes/{node_id}", status_code=204)
async def delete_node(
    node_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    obj = await _get_or_404(db, ProdProcessNode, node_id, "Узел не найден")
    await db.delete(obj)
    await db.commit()


# ---------- Process edges ----------


@router.post("/edges", response_model=EdgeResponse, status_code=201)
async def create_edge(
    data: EdgeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    obj = ProdProcessEdge(**data.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.patch("/edges/{edge_id}", response_model=EdgeResponse)
async def update_edge(
    edge_id: str,
    data: EdgeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    obj = await _get_or_404(db, ProdProcessEdge, edge_id, "Связь не найдена")
    _apply_update(obj, data)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/edges/{edge_id}", status_code=204)
async def delete_edge(
    edge_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    obj = await _get_or_404(db, ProdProcessEdge, edge_id, "Связь не найдена")
    await db.delete(obj)
    await db.commit()


# ---------- Problems ----------


@router.post("/problems", response_model=ProblemResponse, status_code=201)
async def create_problem(
    data: ProblemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    obj = ProdProblem(**data.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.patch("/problems/{problem_id}", response_model=ProblemResponse)
async def update_problem(
    problem_id: str,
    data: ProblemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    obj = await _get_or_404(db, ProdProblem, problem_id, "Проблема не найдена")
    _apply_update(obj, data)
    await db.commit()
    await db.refresh(obj)
    return obj


@router.delete("/problems/{problem_id}", status_code=204)
async def delete_problem(
    problem_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    obj = await _get_or_404(db, ProdProblem, problem_id, "Проблема не найдена")
    await db.delete(obj)
    await db.commit()
