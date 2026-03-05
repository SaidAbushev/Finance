from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict


class NetWorthPoint(BaseModel):
    model_config = ConfigDict(coerce_numbers_to_str=False)
    date: str
    amount: float


class NetWorthResponse(BaseModel):
    points: list[NetWorthPoint]


class CategorySpendItem(BaseModel):
    category_id: Optional[str] = None
    category_name: str
    color: str = "#64748b"
    amount: float
    percentage: float


class CategorySpendResponse(BaseModel):
    items: list[CategorySpendItem]
    total: float
