import uuid
from datetime import datetime as DateTime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel


class BudgetPeriodCreate(BaseModel):
    year: int
    month: int
    amount: Decimal


class BudgetCreate(BaseModel):
    name: str
    amount: Decimal
    category_id: Optional[uuid.UUID] = None


class BudgetUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[Decimal] = None
    category_id: Optional[uuid.UUID] = None


class BudgetPeriodResponse(BaseModel):
    id: uuid.UUID
    budget_id: uuid.UUID
    year: int
    month: int
    amount: Decimal

    model_config = {"from_attributes": True}


class BudgetResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    amount: Decimal
    category_id: Optional[uuid.UUID] = None
    created_at: DateTime
    spent: Decimal = Decimal("0")
    remaining: Decimal = Decimal("0")

    model_config = {"from_attributes": True}


class BudgetListResponse(BaseModel):
    items: list[BudgetResponse]
