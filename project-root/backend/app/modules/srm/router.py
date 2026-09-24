"""SRM (procurement) API router: suppliers, purchase requests, contracts, orders, invoices."""
import os
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Response, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.db.session import get_db
from app.modules.auth.deps import get_current_active_user
from app.modules.auth.models import User
from app.modules.srm.models import (
    Supplier,
    Customer,
    PurchaseRequest,
    Contract,
    PurchaseOrder,
    Invoice,
)
from app.modules.srm.schemas import (
    SupplierCreate,
    SupplierUpdate,
    SupplierResponse,
    CustomerCreate,
    CustomerUpdate,
    CustomerResponse,
    PurchaseRequestCreate,
    PurchaseRequestUpdate,
    PurchaseRequestResponse,
    ContractCreate,
    ContractUpdate,
    ContractResponse,
    PurchaseOrderCreate,
    PurchaseOrderUpdate,
    PurchaseOrderResponse,
    InvoiceCreate,
    InvoiceUpdate,
    InvoiceResponse,
)

router = APIRouter(tags=["srm"])


async def _get_or_404(db: AsyncSession, model, obj_id: int, detail: str):
    result = await db.execute(select(model).where(model.id == obj_id))
    obj = result.scalar_one_or_none()
    if not obj:
        raise HTTPException(status_code=404, detail=detail)
    return obj


def _apply_update(obj, data) -> None:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)


# ---------- Suppliers ----------

@router.get("/suppliers", response_model=list[SupplierResponse])
async def list_suppliers(
    status: Optional[str] = None,
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    query = select(Supplier)
    if status:
        query = query.where(Supplier.status == status)
    if category:
        query = query.where(Supplier.category == category)
    result = await db.execute(query.order_by(Supplier.name))
    return result.scalars().all()


@router.get("/suppliers/{supplier_id}", response_model=SupplierResponse)
async def get_supplier(
    supplier_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await _get_or_404(db, Supplier, supplier_id, "Supplier not found")


@router.post("/suppliers", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
async def create_supplier(
    data: SupplierCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    supplier = Supplier(**data.model_dump())
    db.add(supplier)
    await db.commit()
    await db.refresh(supplier)
    return supplier


@router.patch("/suppliers/{supplier_id}", response_model=SupplierResponse)
async def update_supplier(
    supplier_id: int,
    data: SupplierUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    supplier = await _get_or_404(db, Supplier, supplier_id, "Supplier not found")
    _apply_update(supplier, data)
    await db.commit()
    await db.refresh(supplier)
    return supplier


@router.delete("/suppliers/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_supplier(
    supplier_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    supplier = await _get_or_404(db, Supplier, supplier_id, "Supplier not found")
    await db.delete(supplier)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------- Customers ----------

@router.get("/customers", response_model=list[CustomerResponse])
async def list_customers(
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    query = select(Customer)
    if status:
        query = query.where(Customer.status == status)
    result = await db.execute(query.order_by(Customer.name))
    return result.scalars().all()


@router.get("/customers/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await _get_or_404(db, Customer, customer_id, "Customer not found")


@router.post("/customers", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def create_customer(
    data: CustomerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    customer = Customer(**data.model_dump())
    db.add(customer)
    await db.commit()
    await db.refresh(customer)
    return customer


@router.patch("/customers/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: int,
    data: CustomerUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    customer = await _get_or_404(db, Customer, customer_id, "Customer not found")
    _apply_update(customer, data)
    await db.commit()
    await db.refresh(customer)
    return customer


@router.delete("/customers/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_customer(
    customer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    customer = await _get_or_404(db, Customer, customer_id, "Customer not found")
    await db.delete(customer)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------- Purchase requests ----------

@router.get("/purchase-requests", response_model=list[PurchaseRequestResponse])
async def list_purchase_requests(
    status: Optional[str] = None,
    project_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    query = select(PurchaseRequest)
    if status:
        query = query.where(PurchaseRequest.status == status)
    if project_id is not None:
        query = query.where(PurchaseRequest.project_id == project_id)
    result = await db.execute(query.order_by(PurchaseRequest.created_at.desc()))
    return result.scalars().all()


@router.get("/purchase-requests/{request_id}", response_model=PurchaseRequestResponse)
async def get_purchase_request(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await _get_or_404(db, PurchaseRequest, request_id, "Purchase request not found")


@router.post(
    "/purchase-requests",
    response_model=PurchaseRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_purchase_request(
    data: PurchaseRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    purchase_request = PurchaseRequest(**data.model_dump())
    db.add(purchase_request)
    await db.commit()
    await db.refresh(purchase_request)
    return purchase_request


@router.patch("/purchase-requests/{request_id}", response_model=PurchaseRequestResponse)
async def update_purchase_request(
    request_id: int,
    data: PurchaseRequestUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    purchase_request = await _get_or_404(
        db, PurchaseRequest, request_id, "Purchase request not found"
    )
    _apply_update(purchase_request, data)
    await db.commit()
    await db.refresh(purchase_request)
    return purchase_request


@router.delete("/purchase-requests/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_purchase_request(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    purchase_request = await _get_or_404(
        db, PurchaseRequest, request_id, "Purchase request not found"
    )
    await db.delete(purchase_request)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------- Contracts ----------

# Договоры: только просматриваемые форматы — PDF и Word (редактируемый формат)
_ALLOWED_CONTRACT_ATTACHMENT_EXT = {".pdf", ".doc", ".docx"}


def _contract_attachments_dir() -> str:
    path = os.path.join(settings.IRIS_STORAGE_ROOT, "contract_attachments")
    os.makedirs(path, exist_ok=True)
    return path


@router.post("/contracts/attachments", status_code=status.HTTP_201_CREATED)
async def upload_contract_attachment(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
):
    """Загрузить файл договора до создания договора.

    Возвращает {file_name, stored_name}; пара передаётся при создании договора
    в полях attachment_name / attachment_stored.
    """
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in _ALLOWED_CONTRACT_ATTACHMENT_EXT:
        raise HTTPException(
            status_code=400,
            detail=f"Недопустимый тип файла {ext!r}. Разрешены: {sorted(_ALLOWED_CONTRACT_ATTACHMENT_EXT)}",
        )
    stored_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(_contract_attachments_dir(), stored_name)
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    return {"file_name": file.filename, "stored_name": stored_name}


@router.get("/contracts/attachments/{stored_name}")
async def download_contract_attachment(
    stored_name: str,
    current_user: User = Depends(get_current_active_user),
):
    """Скачать прикреплённый файл договора."""
    if not stored_name or "/" in stored_name or "\\" in stored_name or ".." in stored_name:
        raise HTTPException(status_code=400, detail="Некорректное имя файла")
    file_path = os.path.join(_contract_attachments_dir(), stored_name)
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="Файл не найден")
    return FileResponse(file_path, filename=stored_name)


@router.get("/contracts", response_model=list[ContractResponse])
async def list_contracts(
    status: Optional[str] = None,
    supplier_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    query = select(Contract)
    if status:
        query = query.where(Contract.status == status)
    if supplier_id is not None:
        query = query.where(Contract.supplier_id == supplier_id)
    result = await db.execute(query.order_by(Contract.created_at.desc()))
    return result.scalars().all()


@router.get("/contracts/{contract_id}", response_model=ContractResponse)
async def get_contract(
    contract_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await _get_or_404(db, Contract, contract_id, "Contract not found")


@router.post("/contracts", response_model=ContractResponse, status_code=status.HTTP_201_CREATED)
async def create_contract(
    data: ContractCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    contract = Contract(**data.model_dump())
    db.add(contract)
    await db.commit()
    await db.refresh(contract)
    return contract


@router.patch("/contracts/{contract_id}", response_model=ContractResponse)
async def update_contract(
    contract_id: int,
    data: ContractUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    contract = await _get_or_404(db, Contract, contract_id, "Contract not found")
    _apply_update(contract, data)
    await db.commit()
    await db.refresh(contract)
    return contract


@router.delete("/contracts/{contract_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contract(
    contract_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    contract = await _get_or_404(db, Contract, contract_id, "Contract not found")
    await db.delete(contract)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------- Purchase orders ----------

@router.get("/orders", response_model=list[PurchaseOrderResponse])
async def list_orders(
    status: Optional[str] = None,
    contract_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    query = select(PurchaseOrder)
    if status:
        query = query.where(PurchaseOrder.status == status)
    if contract_id is not None:
        query = query.where(PurchaseOrder.contract_id == contract_id)
    result = await db.execute(query.order_by(PurchaseOrder.created_at.desc()))
    return result.scalars().all()


@router.get("/orders/{order_id}", response_model=PurchaseOrderResponse)
async def get_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await _get_or_404(db, PurchaseOrder, order_id, "Order not found")


@router.post("/orders", response_model=PurchaseOrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    data: PurchaseOrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    order = PurchaseOrder(**data.model_dump())
    db.add(order)
    await db.commit()
    await db.refresh(order)
    return order


@router.patch("/orders/{order_id}", response_model=PurchaseOrderResponse)
async def update_order(
    order_id: int,
    data: PurchaseOrderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    order = await _get_or_404(db, PurchaseOrder, order_id, "Order not found")
    _apply_update(order, data)
    await db.commit()
    await db.refresh(order)
    return order


@router.delete("/orders/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    order = await _get_or_404(db, PurchaseOrder, order_id, "Order not found")
    await db.delete(order)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ---------- Invoices ----------

@router.get("/invoices", response_model=list[InvoiceResponse])
async def list_invoices(
    status: Optional[str] = None,
    contract_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    query = select(Invoice)
    if status:
        query = query.where(Invoice.status == status)
    if contract_id is not None:
        query = query.where(Invoice.contract_id == contract_id)
    result = await db.execute(query.order_by(Invoice.created_at.desc()))
    return result.scalars().all()


@router.get("/invoices/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(
    invoice_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return await _get_or_404(db, Invoice, invoice_id, "Invoice not found")


@router.post("/invoices", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
async def create_invoice(
    data: InvoiceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    invoice = Invoice(**data.model_dump())
    db.add(invoice)
    await db.commit()
    await db.refresh(invoice)
    return invoice


@router.patch("/invoices/{invoice_id}", response_model=InvoiceResponse)
async def update_invoice(
    invoice_id: int,
    data: InvoiceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    invoice = await _get_or_404(db, Invoice, invoice_id, "Invoice not found")
    _apply_update(invoice, data)
    await db.commit()
    await db.refresh(invoice)
    return invoice


@router.delete("/invoices/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_invoice(
    invoice_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    invoice = await _get_or_404(db, Invoice, invoice_id, "Invoice not found")
    await db.delete(invoice)
    await db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
