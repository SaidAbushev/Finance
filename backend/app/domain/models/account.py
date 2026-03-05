import uuid
from datetime import datetime
from decimal import Decimal
from enum import Enum as PyEnum

from sqlalchemy import String, DateTime, Numeric, Integer, Boolean, ForeignKey, func, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database import Base


class AccountType(str, PyEnum):
    CASH = "cash"
    CHECKING = "checking"
    SAVINGS = "savings"
    CREDIT = "credit"
    INVESTMENT = "investment"


class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    type: Mapped[AccountType] = mapped_column(Enum(AccountType, name="account_type", values_callable=lambda e: [m.value for m in e]), nullable=False, default=AccountType.CHECKING)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="RUB")
    initial_balance: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False, default=0)
    color: Mapped[str] = mapped_column(String(7), nullable=False, default="#6366f1")
    icon: Mapped[str] = mapped_column(String(50), nullable=False, default="wallet")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_archived: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="accounts")
    splits = relationship("TransactionSplit", back_populates="account", lazy="noload")
