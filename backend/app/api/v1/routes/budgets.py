import uuid
from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user
from app.api.v1.schemas.budgets import BudgetCreate, BudgetListResponse, BudgetResponse, BudgetUpdate
from app.domain.models.budget import Budget, BudgetPeriod
from app.domain.models.transaction import Transaction, TransactionSplit
from app.domain.models.user import User
from app.infrastructure.database import get_db

router = APIRouter(prefix="/budgets", tags=["budgets"])


async def _compute_spent(
    db: AsyncSession, user_id: uuid.UUID, category_id: uuid.UUID | None, year: int, month: int
) -> Decimal:
    """Compute total spent for a category in a given year/month."""
    if category_id is None:
        return Decimal("0")

    first_day = date(year, month, 1)
    if month == 12:
        last_day = date(year + 1, 1, 1)
    else:
        last_day = date(year, month + 1, 1)

    result = await db.execute(
        select(func.coalesce(func.sum(func.abs(TransactionSplit.amount)), 0))
        .join(Transaction, TransactionSplit.transaction_id == Transaction.id)
        .where(
            Transaction.user_id == user_id,
            TransactionSplit.category_id == category_id,
            Transaction.date >= first_day,
            Transaction.date < last_day,
            TransactionSplit.amount < 0,  # expenses are negative
        )
    )
    return Decimal(str(result.scalar_one()))


async def _budget_to_response(
    db: AsyncSession, budget: Budget, year: int | None = None, month: int | None = None
) -> BudgetResponse:
    from datetime import datetime as dt

    now = dt.now()
    y = year or now.year
    m = month or now.month

    spent = await _compute_spent(db, budget.user_id, budget.category_id, y, m)

    # Check for period-specific amount override
    amount = budget.amount
    if year is not None and month is not None:
        period_result = await db.execute(
            select(BudgetPeriod).where(
                BudgetPeriod.budget_id == budget.id,
                BudgetPeriod.year == year,
                BudgetPeriod.month == month,
            )
        )
        period = period_result.scalar_one_or_none()
        if period is not None:
            amount = period.amount

    remaining = amount - spent

    return BudgetResponse(
        id=budget.id,
        user_id=budget.user_id,
        name=budget.name,
        amount=amount,
        category_id=budget.category_id,
        created_at=budget.created_at,
        spent=spent,
        remaining=remaining,
    )


@router.get("", response_model=BudgetListResponse)
async def list_budgets(
    year: int | None = Query(None),
    month: int | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Budget).where(Budget.user_id == current_user.id).order_by(Budget.created_at)
    )
    budgets = result.scalars().all()
    items = [await _budget_to_response(db, b, year, month) for b in budgets]
    return BudgetListResponse(items=items)


@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
async def create_budget(
    body: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    budget = Budget(
        user_id=current_user.id,
        name=body.name,
        amount=body.amount,
        category_id=body.category_id,
    )
    db.add(budget)
    await db.flush()
    await db.refresh(budget)
    return await _budget_to_response(db, budget)


@router.get("/{budget_id}", response_model=BudgetResponse)
async def get_budget(
    budget_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Budget).where(Budget.id == budget_id, Budget.user_id == current_user.id)
    )
    budget = result.scalar_one_or_none()
    if budget is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")
    return await _budget_to_response(db, budget)


@router.put("/{budget_id}", response_model=BudgetResponse)
async def update_budget(
    budget_id: uuid.UUID,
    body: BudgetUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Budget).where(Budget.id == budget_id, Budget.user_id == current_user.id)
    )
    budget = result.scalar_one_or_none()
    if budget is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(budget, key, value)
    await db.flush()
    await db.refresh(budget)
    return await _budget_to_response(db, budget)


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_budget(
    budget_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Budget).where(Budget.id == budget_id, Budget.user_id == current_user.id)
    )
    budget = result.scalar_one_or_none()
    if budget is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")
    await db.delete(budget)
    await db.flush()


@router.get("/{budget_id}/progress", response_model=BudgetResponse)
async def get_budget_progress(
    budget_id: uuid.UUID,
    year: int = Query(...),
    month: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Budget).where(Budget.id == budget_id, Budget.user_id == current_user.id)
    )
    budget = result.scalar_one_or_none()
    if budget is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")
    return await _budget_to_response(db, budget, year, month)
