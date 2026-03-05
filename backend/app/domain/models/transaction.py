import uuid
from datetime import date, datetime
from decimal import Decimal
from enum import Enum as PyEnum

from sqlalchemy import String, Date, DateTime, Numeric, Text, ForeignKey, func, Enum, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database import Base


class TransactionType(str, PyEnum):
    EXPENSE = "expense"
    INCOME = "income"
    TRANSFER = "transfer"


class TransactionStatus(str, PyEnum):
    PENDING = "pending"
    CLEARED = "cleared"
    RECONCILED = "reconciled"


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    payee: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    note: Mapped[str] = mapped_column(Text, nullable=False, default="")
    type: Mapped[TransactionType] = mapped_column(Enum(TransactionType, name="transaction_type", values_callable=lambda e: [m.value for m in e]), nullable=False)
    status: Mapped[TransactionStatus] = mapped_column(
        Enum(TransactionStatus, name="transaction_status", values_callable=lambda e: [m.value for m in e]), nullable=False, default=TransactionStatus.CLEARED
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="transactions")
    splits = relationship("TransactionSplit", back_populates="transaction", cascade="all, delete-orphan", lazy="selectin")


class TransactionSplit(Base):
    __tablename__ = "transaction_splits"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transaction_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False)
    account_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("accounts.id"), nullable=False)
    category_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    memo: Mapped[str] = mapped_column(String(200), nullable=False, default="")

    transaction = relationship("Transaction", back_populates="splits")
    account = relationship("Account", back_populates="splits")
    category = relationship("Category", back_populates="splits")

    __table_args__ = (
        Index("ix_splits_account_date", "account_id"),
        Index("ix_splits_category", "category_id"),
    )
