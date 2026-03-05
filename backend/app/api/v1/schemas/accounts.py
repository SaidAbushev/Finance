import uuid
from datetime import datetime as DateTime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel

from app.domain.models.account import AccountType


class AccountCreate(BaseModel):
    name: str
    type: AccountType = AccountType.CHECKING
    currency: str = "RUB"
    initial_balance: Decimal = Decimal("0")
    color: str = "#6366f1"
    icon: str = "wallet"
    sort_order: int = 0


class AccountUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[AccountType] = None
    currency: Optional[str] = None
    initial_balance: Optional[Decimal] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    sort_order: Optional[int] = None


class AccountResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    type: AccountType
    currency: str
    initial_balance: Decimal
    balance: Decimal
    color: str
    icon: str
    sort_order: int
    is_archived: bool
    created_at: DateTime

    model_config = {"from_attributes": True}


class AccountListResponse(BaseModel):
    items: list[AccountResponse]
