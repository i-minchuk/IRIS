"""SRM Pydantic schemas (mirror frontend types in src/types/srm.ts)."""
from datetime import datetime
from typing import Optional, Literal

from pydantic import BaseModel, Field, ConfigDict

SupplierStatus = Literal[
    "draft", "verification", "approved", "active", "suspended", "blacklisted", "archived"
]
SupplierType = Literal["manufacturer", "distributor", "contractor", "service_provider"]
SupplierCategory = Literal["materials", "equipment", "services", "subcontractors"]
PurchaseRequestStatus = Literal[
    "draft", "submitted", "manager_review", "director_review", "approved", "rejected",
    "rfq_sent", "quotation_received", "comparison", "po_issued", "completed",
]
RequestPriority = Literal["low", "medium", "high", "critical"]
ContractStatus = Literal[
    "draft", "legal_review", "negotiation", "approved", "signed", "active", "completed", "terminated"
]
OrderStatus = Literal[
    "draft", "submitted", "confirmed", "in_production", "shipped", "in_transit",
    "customs", "delivered", "inspection", "accepted", "rejected", "completed",
]
InvoiceStatus = Literal["received", "verified", "approved", "paid", "overdue", "cancelled"]


# ---------- Supplier ----------

class SupplierBase(BaseModel):
    """Shared supplier fields."""
    model_config = ConfigDict(from_attributes=True)

    name: str = Field(..., min_length=1, max_length=255)
    inn: str = Field(..., min_length=1, max_length=20)
    kpp: Optional[str] = Field(None, max_length=20)
    ogrn: Optional[str] = Field(None, max_length=20)
    type: SupplierType
    category: SupplierCategory
    status: SupplierStatus = "draft"
    rating: float = Field(0.0, ge=0, le=5)
    contact_name: str = Field(..., max_length=255)
    contact_email: str = Field(..., max_length=255)
    contact_phone: str = Field(..., max_length=50)
    address: str = Field(..., max_length=500)
    website: Optional[str] = Field(None, max_length=255)
    verified_by_legal: bool = False
    verified_by_accountant: bool = False


class SupplierCreate(SupplierBase):
    """Schema for creating a supplier."""


class SupplierUpdate(BaseModel):
    """Schema for updating supplier fields (all optional)."""
    model_config = ConfigDict(from_attributes=True)

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    inn: Optional[str] = Field(None, min_length=1, max_length=20)
    kpp: Optional[str] = Field(None, max_length=20)
    ogrn: Optional[str] = Field(None, max_length=20)
    type: Optional[SupplierType] = None
    category: Optional[SupplierCategory] = None
    status: Optional[SupplierStatus] = None
    rating: Optional[float] = Field(None, ge=0, le=5)
    contact_name: Optional[str] = Field(None, max_length=255)
    contact_email: Optional[str] = Field(None, max_length=255)
    contact_phone: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = Field(None, max_length=500)
    website: Optional[str] = Field(None, max_length=255)
    verified_by_legal: Optional[bool] = None
    verified_by_accountant: Optional[bool] = None


class SupplierResponse(SupplierBase):
    """Supplier response schema."""
    id: int
    created_at: datetime
    updated_at: datetime


# ---------- PurchaseRequest ----------

class PurchaseRequestBase(BaseModel):
    """Shared purchase request fields."""
    model_config = ConfigDict(from_attributes=True)

    title: str = Field(..., min_length=1, max_length=255)
    description: str = ""
    project_id: int
    project_name: str = Field(..., max_length=255)
    status: PurchaseRequestStatus = "draft"
    requester: str = Field(..., max_length=255)
    amount: float = Field(..., ge=0)
    currency: str = Field("RUB", min_length=3, max_length=3)
    priority: RequestPriority = "medium"
    deadline: Optional[datetime] = None


class PurchaseRequestCreate(PurchaseRequestBase):
    """Schema for creating a purchase request."""


class PurchaseRequestUpdate(BaseModel):
    """Schema for updating purchase request fields (all optional)."""
    model_config = ConfigDict(from_attributes=True)

    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    project_id: Optional[int] = None
    project_name: Optional[str] = Field(None, max_length=255)
    status: Optional[PurchaseRequestStatus] = None
    requester: Optional[str] = Field(None, max_length=255)
    amount: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    priority: Optional[RequestPriority] = None
    deadline: Optional[datetime] = None


class PurchaseRequestResponse(PurchaseRequestBase):
    """Purchase request response schema."""
    id: int
    created_at: datetime


# ---------- Contract ----------

class ContractBase(BaseModel):
    """Shared contract fields."""
    model_config = ConfigDict(from_attributes=True)

    number: str = Field(..., min_length=1, max_length=100)
    title: str = Field(..., min_length=1, max_length=255)
    supplier_id: int
    supplier_name: str = Field(..., max_length=255)
    status: ContractStatus = "draft"
    amount: float = Field(..., ge=0)
    currency: str = Field("RUB", min_length=3, max_length=3)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    project_id: int
    project_name: str = Field(..., max_length=255)


class ContractCreate(ContractBase):
    """Schema for creating a contract."""


class ContractUpdate(BaseModel):
    """Schema for updating contract fields (all optional)."""
    model_config = ConfigDict(from_attributes=True)

    number: Optional[str] = Field(None, min_length=1, max_length=100)
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    supplier_id: Optional[int] = None
    supplier_name: Optional[str] = Field(None, max_length=255)
    status: Optional[ContractStatus] = None
    amount: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    project_id: Optional[int] = None
    project_name: Optional[str] = Field(None, max_length=255)


class ContractResponse(ContractBase):
    """Contract response schema."""
    id: int


# ---------- PurchaseOrder ----------

class PurchaseOrderBase(BaseModel):
    """Shared purchase order fields."""
    model_config = ConfigDict(from_attributes=True)

    number: str = Field(..., min_length=1, max_length=100)
    contract_id: int
    supplier_name: str = Field(..., max_length=255)
    status: OrderStatus = "draft"
    amount: float = Field(..., ge=0)
    currency: str = Field("RUB", min_length=3, max_length=3)
    order_date: Optional[datetime] = None
    delivery_date: Optional[datetime] = None
    project_id: int
    project_name: str = Field(..., max_length=255)


class PurchaseOrderCreate(PurchaseOrderBase):
    """Schema for creating a purchase order."""


class PurchaseOrderUpdate(BaseModel):
    """Schema for updating purchase order fields (all optional)."""
    model_config = ConfigDict(from_attributes=True)

    number: Optional[str] = Field(None, min_length=1, max_length=100)
    contract_id: Optional[int] = None
    supplier_name: Optional[str] = Field(None, max_length=255)
    status: Optional[OrderStatus] = None
    amount: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    order_date: Optional[datetime] = None
    delivery_date: Optional[datetime] = None
    project_id: Optional[int] = None
    project_name: Optional[str] = Field(None, max_length=255)


class PurchaseOrderResponse(PurchaseOrderBase):
    """Purchase order response schema."""
    id: int


# ---------- Invoice ----------

class InvoiceBase(BaseModel):
    """Shared invoice fields."""
    model_config = ConfigDict(from_attributes=True)

    number: str = Field(..., min_length=1, max_length=100)
    supplier_name: str = Field(..., max_length=255)
    contract_id: int
    order_id: Optional[int] = None
    status: InvoiceStatus = "received"
    amount: float = Field(..., ge=0)
    currency: str = Field("RUB", min_length=3, max_length=3)
    issue_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    paid_date: Optional[datetime] = None


class InvoiceCreate(InvoiceBase):
    """Schema for creating an invoice."""


class InvoiceUpdate(BaseModel):
    """Schema for updating invoice fields (all optional)."""
    model_config = ConfigDict(from_attributes=True)

    number: Optional[str] = Field(None, min_length=1, max_length=100)
    supplier_name: Optional[str] = Field(None, max_length=255)
    contract_id: Optional[int] = None
    order_id: Optional[int] = None
    status: Optional[InvoiceStatus] = None
    amount: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    issue_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    paid_date: Optional[datetime] = None


class InvoiceResponse(InvoiceBase):
    """Invoice response schema."""
    id: int
