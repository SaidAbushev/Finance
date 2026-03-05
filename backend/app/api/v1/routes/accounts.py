import uuid
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user
from app.api.v1.schemas.accounts import AccountCreate, AccountListResponse, AccountResponse, AccountUpdate
from app.domain.models.account import Account
from app.domain.models.transaction import TransactionSplit
from app.domain.models.user import User
from app.infrastructure.database import get_db

router = APIRouter(prefix="/accounts", tags=["accounts"])


async def _compute_balance(db: AsyncSession, account_id: uuid.UUID, initial_balance: Decimal) -> Decimal:
    result = await db.execute(
        select(func.coalesce(func.sum(TransactionSplit.amount), 0)).where(
            TransactionSplit.account_id == account_id
        )
    )
    splits_sum = result.scalar_one()
    return initial_balance + Decimal(str(splits_sum))


async def _account_to_response(db: AsyncSession, account: Account) -> AccountResponse:
    balance = await _compute_balance(db, account.id, account.initial_balance)
    return AccountResponse(
        id=account.id,
        user_id=account.user_id,
        name=account.name,
        type=account.type,
        currency=account.currency,
        initial_balance=account.initial_balance,
        balance=balance,
        color=account.color,
        icon=account.icon,
        sort_order=account.sort_order,
        is_archived=account.is_archived,
        created_at=account.created_at,
    )


@router.get("", response_model=AccountListResponse)
async def list_accounts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Account)
        .where(Account.user_id == current_user.id)
        .order_by(Account.sort_order, Account.created_at)
    )
    accounts = result.scalars().all()
    items = [await _account_to_response(db, a) for a in accounts]
    return AccountListResponse(items=items)


@router.post("", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
async def create_account(
    body: AccountCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    account = Account(
        user_id=current_user.id,
        name=body.name,
        type=body.type,
        currency=body.currency,
        initial_balance=body.initial_balance,
        color=body.color,
        icon=body.icon,
        sort_order=body.sort_order,
    )
    db.add(account)
    await db.flush()
    await db.refresh(account)
    return await _account_to_response(db, account)


@router.get("/{account_id}", response_model=AccountResponse)
async def get_account(
    account_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Account).where(Account.id == account_id, Account.user_id == current_user.id)
    )
    account = result.scalar_one_or_none()
    if account is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    return await _account_to_response(db, account)


@router.put("/{account_id}", response_model=AccountResponse)
async def update_account(
    account_id: uuid.UUID,
    body: AccountUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Account).where(Account.id == account_id, Account.user_id == current_user.id)
    )
    account = result.scalar_one_or_none()
    if account is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(account, key, value)
    await db.flush()
    await db.refresh(account)
    return await _account_to_response(db, account)


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    account_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Account).where(Account.id == account_id, Account.user_id == current_user.id)
    )
    account = result.scalar_one_or_none()
    if account is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    await db.delete(account)
    await db.flush()


@router.post("/{account_id}/archive", response_model=AccountResponse)
async def archive_account(
    account_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Account).where(Account.id == account_id, Account.user_id == current_user.id)
    )
    account = result.scalar_one_or_none()
    if account is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    account.is_archived = not account.is_archived
    await db.flush()
    await db.refresh(account)
    return await _account_to_response(db, account)
