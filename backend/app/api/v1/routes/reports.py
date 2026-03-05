from datetime import date, datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user
from app.api.v1.schemas.reports import (
    CategorySpendItem,
    CategorySpendResponse,
    NetWorthPoint,
    NetWorthResponse,
)
from app.domain.models.account import Account
from app.domain.models.category import Category
from app.domain.models.transaction import Transaction, TransactionSplit
from app.domain.models.user import User
from app.infrastructure.database import get_db

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/networth", response_model=NetWorthResponse)
async def get_networth(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    accounts_result = await db.execute(
        select(Account.id, Account.initial_balance).where(Account.user_id == current_user.id)
    )
    accounts = accounts_result.all()

    if not accounts:
        return NetWorthResponse(points=[])

    account_ids = [a.id for a in accounts]
    total_initial = sum(a.initial_balance for a in accounts)

    monthly_stmt = (
        select(
            func.extract("year", Transaction.date).label("year"),
            func.extract("month", Transaction.date).label("month"),
            func.sum(TransactionSplit.amount).label("total"),
        )
        .join(Transaction, TransactionSplit.transaction_id == Transaction.id)
        .where(
            Transaction.user_id == current_user.id,
            TransactionSplit.account_id.in_(account_ids),
        )
        .group_by(
            func.extract("year", Transaction.date),
            func.extract("month", Transaction.date),
        )
        .order_by(
            func.extract("year", Transaction.date),
            func.extract("month", Transaction.date),
        )
    )

    result = await db.execute(monthly_stmt)
    rows = result.all()

    points: list[NetWorthPoint] = []
    cumulative = total_initial

    for row in rows:
        cumulative += Decimal(str(row.total))
        month_str = f"{int(row.year)}-{int(row.month):02d}"
        points.append(NetWorthPoint(date=month_str, amount=cumulative))

    if not points:
        now = datetime.now()
        points.append(
            NetWorthPoint(date=f"{now.year}-{now.month:02d}", amount=total_initial)
        )

    return NetWorthResponse(points=points)


@router.get("/category-spend", response_model=CategorySpendResponse)
async def get_category_spend(
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(
            TransactionSplit.category_id,
            func.sum(func.abs(TransactionSplit.amount)).label("total"),
        )
        .join(Transaction, TransactionSplit.transaction_id == Transaction.id)
        .where(
            Transaction.user_id == current_user.id,
            TransactionSplit.amount < 0,
        )
        .group_by(TransactionSplit.category_id)
        .order_by(func.sum(func.abs(TransactionSplit.amount)).desc())
    )

    if date_from is not None:
        stmt = stmt.where(Transaction.date >= date_from)
    if date_to is not None:
        stmt = stmt.where(Transaction.date <= date_to)

    result = await db.execute(stmt)
    rows = result.all()

    grand_total = sum(Decimal(str(r.total)) for r in rows) if rows else Decimal("0")

    items: list[CategorySpendItem] = []
    for row in rows:
        amount = Decimal(str(row.total))
        cat_name = "Без категории"
        cat_color = "#64748b"
        cat_id_str: str | None = None

        if row.category_id is not None:
            cat_result = await db.execute(
                select(Category.name, Category.color).where(Category.id == row.category_id)
            )
            cat_row = cat_result.first()
            if cat_row:
                cat_name = cat_row.name
                cat_color = cat_row.color
            cat_id_str = str(row.category_id)

        percentage = (amount / grand_total * 100) if grand_total > 0 else Decimal("0")

        items.append(
            CategorySpendItem(
                category_id=cat_id_str,
                category_name=cat_name,
                color=cat_color,
                amount=amount,
                percentage=percentage.quantize(Decimal("0.01")),
            )
        )

    return CategorySpendResponse(items=items, total=grand_total)
