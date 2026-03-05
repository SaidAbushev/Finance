import uuid
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.v1.deps import get_current_user
from app.api.v1.schemas.transactions import (
    TransactionCreate,
    TransactionListResponse,
    TransactionResponse,
    TransactionUpdate,
)
from app.domain.models.transaction import Transaction, TransactionSplit
from app.domain.models.user import User
from app.infrastructure.database import get_db

router = APIRouter(prefix="/transactions", tags=["transactions"])

DEFAULT_PAGE_SIZE = 50


def _txn_to_response(txn: Transaction) -> TransactionResponse:
    return TransactionResponse.model_validate(txn)


@router.get("", response_model=TransactionListResponse)
async def list_transactions(
    account_id: uuid.UUID | None = Query(None),
    category_id: uuid.UUID | None = Query(None),
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    search: str | None = Query(None),
    cursor: str | None = Query(None),
    limit: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Transaction)
        .options(selectinload(Transaction.splits))
        .where(Transaction.user_id == current_user.id)
    )

    if account_id is not None:
        stmt = stmt.where(
            Transaction.id.in_(
                select(TransactionSplit.transaction_id).where(TransactionSplit.account_id == account_id)
            )
        )

    if category_id is not None:
        stmt = stmt.where(
            Transaction.id.in_(
                select(TransactionSplit.transaction_id).where(TransactionSplit.category_id == category_id)
            )
        )

    if date_from is not None:
        stmt = stmt.where(Transaction.date >= date_from)

    if date_to is not None:
        stmt = stmt.where(Transaction.date <= date_to)

    if search:
        pattern = f"%{search}%"
        stmt = stmt.where(
            Transaction.payee.ilike(pattern) | Transaction.note.ilike(pattern)
        )

    if cursor is not None:
        try:
            cursor_dt = datetime.fromisoformat(cursor)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid cursor format")
        stmt = stmt.where(Transaction.created_at < cursor_dt)

    stmt = stmt.order_by(Transaction.created_at.desc()).limit(limit + 1)

    result = await db.execute(stmt)
    rows = list(result.scalars().all())

    has_more = len(rows) > limit
    if has_more:
        rows = rows[:limit]

    items = [_txn_to_response(t) for t in rows]

    next_cursor = None
    if has_more and rows:
        next_cursor = rows[-1].created_at.isoformat()

    return TransactionListResponse(items=items, next_cursor=next_cursor, has_more=has_more)


@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    body: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not body.splits:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="At least one split is required")

    txn = Transaction(
        user_id=current_user.id,
        date=body.date,
        payee=body.payee,
        note=body.note,
        type=body.type,
        status=body.status,
    )
    db.add(txn)
    await db.flush()

    for s in body.splits:
        split = TransactionSplit(
            transaction_id=txn.id,
            account_id=s.account_id,
            category_id=s.category_id,
            amount=s.amount,
            memo=s.memo,
        )
        db.add(split)

    await db.flush()
    await db.refresh(txn)

    # Reload with splits
    result = await db.execute(
        select(Transaction)
        .options(selectinload(Transaction.splits))
        .where(Transaction.id == txn.id)
    )
    txn = result.scalar_one()
    return _txn_to_response(txn)


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Transaction)
        .options(selectinload(Transaction.splits))
        .where(Transaction.id == transaction_id, Transaction.user_id == current_user.id)
    )
    txn = result.scalar_one_or_none()
    if txn is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    return _txn_to_response(txn)


@router.put("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: uuid.UUID,
    body: TransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Transaction)
        .options(selectinload(Transaction.splits))
        .where(Transaction.id == transaction_id, Transaction.user_id == current_user.id)
    )
    txn = result.scalar_one_or_none()
    if txn is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    update_data = body.model_dump(exclude_unset=True)
    splits_data = update_data.pop("splits", None)

    for key, value in update_data.items():
        setattr(txn, key, value)

    if splits_data is not None:
        # Delete existing splits
        for existing_split in list(txn.splits):
            await db.delete(existing_split)
        await db.flush()

        # Create new splits
        for s in splits_data:
            split = TransactionSplit(
                transaction_id=txn.id,
                account_id=s["account_id"],
                category_id=s.get("category_id"),
                amount=s["amount"],
                memo=s.get("memo", ""),
            )
            db.add(split)

    await db.flush()

    # Reload
    result = await db.execute(
        select(Transaction)
        .options(selectinload(Transaction.splits))
        .where(Transaction.id == txn.id)
    )
    txn = result.scalar_one()
    return _txn_to_response(txn)


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Transaction).where(Transaction.id == transaction_id, Transaction.user_id == current_user.id)
    )
    txn = result.scalar_one_or_none()
    if txn is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    await db.delete(txn)
    await db.flush()
