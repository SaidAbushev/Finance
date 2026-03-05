import uuid
from enum import Enum as PyEnum

from sqlalchemy import String, Integer, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database import Base


class CategoryType(str, PyEnum):
    INCOME = "income"
    EXPENSE = "expense"


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    parent_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True)
    icon: Mapped[str] = mapped_column(String(50), nullable=False, default="tag")
    color: Mapped[str] = mapped_column(String(7), nullable=False, default="#6366f1")
    type: Mapped[CategoryType] = mapped_column(Enum(CategoryType, name="category_type", values_callable=lambda e: [m.value for m in e]), nullable=False, default=CategoryType.EXPENSE)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    parent = relationship("Category", remote_side="Category.id", backref="children")
    user = relationship("User", back_populates="categories")
    splits = relationship("TransactionSplit", back_populates="category", lazy="noload")
