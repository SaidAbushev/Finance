from decimal import Decimal
from typing import Optional

from pydantic import BaseModel


class NetWorthPoint(BaseModel):
    date: str
    amount: Decimal


class NetWorthResponse(BaseModel):
    points: list[NetWorthPoint]


class CategorySpendItem(BaseModel):
    category_id: Optional[str] = None
    category_name: str
    color: str = "#64748b"
    amount: Decimal
    percentage: Decimal


class CategorySpendResponse(BaseModel):
    items: list[CategorySpendItem]
    total: Decimal
