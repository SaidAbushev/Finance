import csv
import io
import uuid
from datetime import date, datetime
from decimal import Decimal, InvalidOperation

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user
from app.domain.models.account import Account
from app.domain.models.transaction import Transaction, TransactionSplit, TransactionStatus, TransactionType
from app.domain.models.user import User
from app.infrastructure.database import get_db

router = APIRouter(prefix="/imports", tags=["imports"])


class PreviewRow(BaseModel):
    row_number: int
    date: str
    payee: str
    amount: str
    note: str


class UploadPreviewResponse(BaseModel):
    columns: list[str]
    rows: list[PreviewRow]
    total_rows: int


class ConfirmImportRow(BaseModel):
    date: str  # YYYY-MM-DD
    payee: str = ""
    amount: str
    note: str = ""
    category_id: uuid.UUID | None = None


class ConfirmImportRequest(BaseModel):
    account_id: uuid.UUID
    rows: list[ConfirmImportRow]


class ConfirmImportResponse(BaseModel):
    imported_count: int


def _detect_delimiter(sample: str) -> str:
    """Auto-detect CSV delimiter by checking common delimiters."""
    for delim in [",", ";", "\t", "|"]:
        reader = csv.reader(io.StringIO(sample), delimiter=delim)
        try:
            first_row = next(reader)
            if len(first_row) > 1:
                return delim
        except StopIteration:
            continue
    return ","


def _find_column(headers: list[str], candidates: list[str]) -> int | None:
    """Find column index matching one of the candidate names (case-insensitive)."""
    lower_headers = [h.strip().lower() for h in headers]
    for candidate in candidates:
        if candidate.lower() in lower_headers:
            return lower_headers.index(candidate.lower())
    return None


@router.post("/upload", response_model=UploadPreviewResponse)
async def upload_csv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    if file.content_type and "csv" not in file.content_type and "text" not in file.content_type:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File must be CSV")

    content_bytes = await file.read()
    # Try UTF-8 first, then fall back to cp1251 (common for Russian CSV)
    try:
        content = content_bytes.decode("utf-8-sig")
    except UnicodeDecodeError:
        content = content_bytes.decode("cp1251")

    delimiter = _detect_delimiter(content)
    reader = csv.reader(io.StringIO(content), delimiter=delimiter)
    rows_raw = list(reader)

    if not rows_raw:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="CSV file is empty")

    headers = rows_raw[0]
    data_rows = rows_raw[1:]

    # Try to map columns
    date_col = _find_column(headers, ["date", "дата", "Date", "DATE"])
    payee_col = _find_column(headers, ["payee", "получатель", "description", "описание", "name", "контрагент"])
    amount_col = _find_column(headers, ["amount", "сумма", "sum", "Amount", "AMOUNT"])
    note_col = _find_column(headers, ["note", "memo", "примечание", "комментарий", "comment"])

    preview_rows: list[PreviewRow] = []
    for i, row in enumerate(data_rows[:100]):  # preview max 100 rows
        date_val = row[date_col].strip() if date_col is not None and date_col < len(row) else ""
        payee_val = row[payee_col].strip() if payee_col is not None and payee_col < len(row) else ""
        amount_val = row[amount_col].strip() if amount_col is not None and amount_col < len(row) else ""
        note_val = row[note_col].strip() if note_col is not None and note_col < len(row) else ""

        preview_rows.append(
            PreviewRow(
                row_number=i + 1,
                date=date_val,
                payee=payee_val,
                amount=amount_val,
                note=note_val,
            )
        )

    return UploadPreviewResponse(
        columns=headers,
        rows=preview_rows,
        total_rows=len(data_rows),
    )


@router.post("/confirm", response_model=ConfirmImportResponse, status_code=status.HTTP_201_CREATED)
async def confirm_import(
    body: ConfirmImportRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify account belongs to user
    result = await db.execute(
        select(Account).where(Account.id == body.account_id, Account.user_id == current_user.id)
    )
    account = result.scalar_one_or_none()
    if account is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    imported = 0
    for row in body.rows:
        # Parse date
        try:
            txn_date = date.fromisoformat(row.date)
        except ValueError:
            # Try other common formats
            for fmt in ["%d.%m.%Y", "%d/%m/%Y", "%m/%d/%Y"]:
                try:
                    txn_date = datetime.strptime(row.date, fmt).date()
                    break
                except ValueError:
                    continue
            else:
                continue  # skip rows with unparseable dates

        # Parse amount
        try:
            # Handle Russian number format (comma as decimal separator)
            cleaned = row.amount.replace(" ", "").replace("\u00a0", "").replace(",", ".")
            amount = Decimal(cleaned)
        except (InvalidOperation, ValueError):
            continue  # skip rows with unparseable amounts

        # Determine transaction type
        if amount >= 0:
            txn_type = TransactionType.INCOME
        else:
            txn_type = TransactionType.EXPENSE

        txn = Transaction(
            user_id=current_user.id,
            date=txn_date,
            payee=row.payee,
            note=row.note,
            type=txn_type,
            status=TransactionStatus.CLEARED,
        )
        db.add(txn)
        await db.flush()

        split = TransactionSplit(
            transaction_id=txn.id,
            account_id=body.account_id,
            category_id=row.category_id,
            amount=amount,
            memo="",
        )
        db.add(split)
        imported += 1

    await db.flush()
    return ConfirmImportResponse(imported_count=imported)
