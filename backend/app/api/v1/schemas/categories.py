from __future__ import annotations

import uuid
from typing import Optional

from pydantic import BaseModel

from app.domain.models.category import CategoryType


class CategoryCreate(BaseModel):
    name: str
    parent_id: Optional[uuid.UUID] = None
    icon: str = "tag"
    color: str = "#6366f1"
    type: CategoryType = CategoryType.EXPENSE
    sort_order: int = 0


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[uuid.UUID] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    type: Optional[CategoryType] = None
    sort_order: Optional[int] = None


class CategoryResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    parent_id: Optional[uuid.UUID] = None
    icon: str
    color: str
    type: CategoryType
    sort_order: int
    children: list[CategoryResponse] = []

    model_config = {"from_attributes": True}


class CategoryTreeResponse(BaseModel):
    items: list[CategoryResponse]
