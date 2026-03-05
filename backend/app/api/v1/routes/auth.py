from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from jose import jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.api.v1.deps import ALGORITHM, get_current_user, get_password_hash, verify_password
from app.api.v1.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.domain.models.user import User
from app.infrastructure.database import get_db
from app.infrastructure.seed import create_default_categories

router = APIRouter(prefix="/auth", tags=["auth"])


def _create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": user_id, "exp": expire}, settings.SECRET_KEY, algorithm=ALGORITHM)


def _create_refresh_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return jwt.encode({"sub": user_id, "exp": expire, "type": "refresh"}, settings.SECRET_KEY, algorithm=ALGORITHM)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        email=body.email,
        password_hash=get_password_hash(body.password),
        name=body.name,
    )
    db.add(user)
    await db.flush()

    await create_default_categories(db, user.id)
    await db.flush()

    uid = str(user.id)
    return TokenResponse(
        access_token=_create_access_token(uid),
        refresh_token=_create_refresh_token(uid),
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    uid = str(user.id)
    return TokenResponse(
        access_token=_create_access_token(uid),
        refresh_token=_create_refresh_token(uid),
    )


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return current_user
