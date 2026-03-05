"""Initial schema

Revision ID: 001
Revises:
Create Date: 2026-03-05
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enums
    account_type = postgresql.ENUM("cash", "checking", "savings", "credit", "investment", name="account_type", create_type=False)
    category_type = postgresql.ENUM("income", "expense", name="category_type", create_type=False)
    transaction_type = postgresql.ENUM("expense", "income", "transfer", name="transaction_type", create_type=False)
    transaction_status = postgresql.ENUM("pending", "cleared", "reconciled", name="transaction_status", create_type=False)

    account_type.create(op.get_bind(), checkfirst=True)
    category_type.create(op.get_bind(), checkfirst=True)
    transaction_type.create(op.get_bind(), checkfirst=True)
    transaction_status.create(op.get_bind(), checkfirst=True)

    # Users
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), unique=True, nullable=False, index=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Accounts
    op.create_table(
        "accounts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("type", account_type, nullable=False, server_default="checking"),
        sa.Column("currency", sa.String(3), nullable=False, server_default="RUB"),
        sa.Column("initial_balance", sa.Numeric(15, 2), nullable=False, server_default="0"),
        sa.Column("color", sa.String(7), nullable=False, server_default="#6366f1"),
        sa.Column("icon", sa.String(50), nullable=False, server_default="wallet"),
        sa.Column("sort_order", sa.Integer, nullable=False, server_default="0"),
        sa.Column("is_archived", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Categories
    op.create_table(
        "categories",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("parent_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("categories.id"), nullable=True),
        sa.Column("icon", sa.String(50), nullable=False, server_default="tag"),
        sa.Column("color", sa.String(7), nullable=False, server_default="#6366f1"),
        sa.Column("type", category_type, nullable=False, server_default="expense"),
        sa.Column("sort_order", sa.Integer, nullable=False, server_default="0"),
    )

    # Transactions
    op.create_table(
        "transactions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("date", sa.Date, nullable=False),
        sa.Column("payee", sa.String(200), nullable=False, server_default=""),
        sa.Column("note", sa.Text, nullable=False, server_default=""),
        sa.Column("type", transaction_type, nullable=False),
        sa.Column("status", transaction_status, nullable=False, server_default="cleared"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Transaction Splits
    op.create_table(
        "transaction_splits",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("transaction_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("account_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("accounts.id"), nullable=False),
        sa.Column("category_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("categories.id"), nullable=True),
        sa.Column("amount", sa.Numeric(15, 2), nullable=False),
        sa.Column("memo", sa.String(200), nullable=False, server_default=""),
    )
    op.create_index("ix_splits_account_date", "transaction_splits", ["account_id"])
    op.create_index("ix_splits_category", "transaction_splits", ["category_id"])

    # Budgets
    op.create_table(
        "budgets",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("amount", sa.Numeric(15, 2), nullable=False),
        sa.Column("category_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("categories.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    # Budget Periods
    op.create_table(
        "budget_periods",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("budget_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("budgets.id", ondelete="CASCADE"), nullable=False),
        sa.Column("year", sa.Integer, nullable=False),
        sa.Column("month", sa.Integer, nullable=False),
        sa.Column("amount", sa.Numeric(15, 2), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("budget_periods")
    op.drop_table("budgets")
    op.drop_table("transaction_splits")
    op.drop_table("transactions")
    op.drop_table("categories")
    op.drop_table("accounts")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS account_type")
    op.execute("DROP TYPE IF EXISTS category_type")
    op.execute("DROP TYPE IF EXISTS transaction_type")
    op.execute("DROP TYPE IF EXISTS transaction_status")
