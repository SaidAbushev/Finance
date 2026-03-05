import uuid
from datetime import date as Date, datetime as DateTime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel

from app.domain.models.transaction import TransactionStatus, TransactionType


class SplitCreate(BaseModel):
    account_id: uuid.UUID
    category_id: Optional[uuid.UUID] = None
    amount: Decimal
    memo: str = ""


class TransactionCreate(BaseModel):
    date: Date
    payee: str = ""
    note: str = ""
    type: TransactionType
    status: TransactionStatus = TransactionStatus.CLEARED
    splits: list[SplitCreate]


class SplitUpdate(BaseModel):
    id: Optional[uuid.UUID] = None
    account_id: uuid.UUID
    category_id: Optional[uuid.UUID] = None
    amount: Decimal
    memo: str = ""


class TransactionUpdate(BaseModel):
    date: Optional[Date] = None
    payee: Optional[str] = None
    note: Optional[str] = None
    type: Optional[TransactionType] = None
    status: Optional[TransactionStatus] = None
    splits: Optional[list[SplitUpdate]] = None


class SplitResponse(BaseModel):
    id: uuid.UUID
    transaction_id: uuid.UUID
    account_id: uuid.UUID
    category_id: Optional[uuid.UUID] = None
    amount: Decimal
    memo: str

    model_config = {"from_attributes": True}


class TransactionResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    date: Date
    payee: str
    note: str
    type: TransactionType
    status: TransactionStatus
    created_at: DateTime
    updated_at: DateTime
    splits: list[SplitResponse]

    model_config = {"from_attributes": True}


class TransactionListResponse(BaseModel):
    items: list[TransactionResponse]
    next_cursor: Optional[str] = None
    has_more: bool
