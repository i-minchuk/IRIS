"""Pydantic-схемы производственного процесса (совместимы с фронтенд-типами стратегии)."""
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class _Base(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


# ---------- Departments ----------


class DepartmentBase(_Base):
    key: str
    label: str
    short_label: str = Field(alias="shortLabel")
    color: str
    bg: str
    border: str
    lane_y: int = Field(default=0, alias="laneY")
    lane_h: int = Field(default=130, alias="laneH")
    position: int = 0


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(_Base):
    label: Optional[str] = None
    short_label: Optional[str] = Field(default=None, alias="shortLabel")
    color: Optional[str] = None
    bg: Optional[str] = None
    border: Optional[str] = None
    lane_y: Optional[int] = Field(default=None, alias="laneY")
    lane_h: Optional[int] = Field(default=None, alias="laneH")
    position: Optional[int] = None


class DepartmentResponse(DepartmentBase):
    employees: list[str] = []


# ---------- Employees ----------


class EmployeeCreate(_Base):
    id: str
    name: str
    role: str
    dept_key: str = Field(alias="dept")
    kpi_load: int = Field(default=0, alias="kpiLoad")
    user_id: Optional[int] = Field(default=None, alias="userId")
    tasks: list[str] = []
    position: int = 0


class EmployeeUpdate(_Base):
    name: Optional[str] = None
    role: Optional[str] = None
    dept_key: Optional[str] = Field(default=None, alias="dept")
    kpi_load: Optional[int] = Field(default=None, alias="kpiLoad")
    user_id: Optional[int] = Field(default=None, alias="userId")
    tasks: Optional[list[str]] = None
    position: Optional[int] = None


class EmployeeResponse(_Base):
    id: str
    name: str
    role: str
    dept_key: str = Field(alias="dept")
    kpi_load: int = Field(alias="kpiLoad")
    user_id: Optional[int] = Field(default=None, alias="userId")
    tasks: list[str] = []


# ---------- Process nodes ----------


class NodeKpi(_Base):
    label: str
    value: str
    status: str = "ok"


class NodeBase(_Base):
    id: str
    label: str
    dept_key: str = Field(alias="dept")
    x: int = 0
    y: int = 0
    w: int = 170
    h: int = 76
    type: str = "task"
    issue: str = "ok"
    docs: list[str] = []
    employees: list[str] = []
    kpis: list[NodeKpi] = []
    description: str = ""
    avg_days: float = Field(default=0.0, alias="avgDays")
    position: int = 0


class NodeCreate(NodeBase):
    pass


class NodeUpdate(_Base):
    label: Optional[str] = None
    dept_key: Optional[str] = Field(default=None, alias="dept")
    x: Optional[int] = None
    y: Optional[int] = None
    w: Optional[int] = None
    h: Optional[int] = None
    type: Optional[str] = None
    issue: Optional[str] = None
    docs: Optional[list[str]] = None
    employees: Optional[list[str]] = None
    kpis: Optional[list[NodeKpi]] = None
    description: Optional[str] = None
    avg_days: Optional[float] = Field(default=None, alias="avgDays")
    position: Optional[int] = None


class NodeResponse(NodeBase):
    pass


# ---------- Process edges ----------


class EdgeBase(_Base):
    id: str
    from_node: str = Field(alias="from")
    to_node: str = Field(alias="to")
    type: str = "sequence"
    label: Optional[str] = None
    position: int = 0


class EdgeCreate(EdgeBase):
    pass


class EdgeUpdate(_Base):
    from_node: Optional[str] = Field(default=None, alias="from")
    to_node: Optional[str] = Field(default=None, alias="to")
    type: Optional[str] = None
    label: Optional[str] = None
    position: Optional[int] = None


class EdgeResponse(EdgeBase):
    pass


# ---------- Problems ----------


class ProblemBase(_Base):
    id: str
    title: str
    severity: str = "warn"
    tasks: list[str] = []
    description: str = ""
    recommendation: str = ""
    position: int = 0


class ProblemCreate(ProblemBase):
    pass


class ProblemUpdate(_Base):
    title: Optional[str] = None
    severity: Optional[str] = None
    tasks: Optional[list[str]] = None
    description: Optional[str] = None
    recommendation: Optional[str] = None
    position: Optional[int] = None


class ProblemResponse(ProblemBase):
    pass


# ---------- Aggregated strategy payload ----------


class StrategyResponse(_Base):
    departments: list[DepartmentResponse] = []
    employees: list[EmployeeResponse] = []
    nodes: list[NodeResponse] = []
    edges: list[EdgeResponse] = []
    problems: list[ProblemResponse] = []
