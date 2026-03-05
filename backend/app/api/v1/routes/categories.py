import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.deps import get_current_user
from app.api.v1.schemas.categories import CategoryCreate, CategoryResponse, CategoryTreeResponse, CategoryUpdate
from app.domain.models.category import Category
from app.domain.models.user import User
from app.infrastructure.database import get_db

router = APIRouter(prefix="/categories", tags=["categories"])


def _build_tree(categories: list[Category]) -> list[CategoryResponse]:
    by_id: dict[uuid.UUID, CategoryResponse] = {}
    roots: list[CategoryResponse] = []

    for cat in categories:
        resp = CategoryResponse(
            id=cat.id,
            user_id=cat.user_id,
            name=cat.name,
            parent_id=cat.parent_id,
            icon=cat.icon,
            color=cat.color,
            type=cat.type,
            sort_order=cat.sort_order,
            children=[],
        )
        by_id[cat.id] = resp

    for cat in categories:
        resp = by_id[cat.id]
        if cat.parent_id is not None and cat.parent_id in by_id:
            by_id[cat.parent_id].children.append(resp)
        else:
            roots.append(resp)

    return roots


@router.get("", response_model=CategoryTreeResponse)
async def list_categories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Category)
        .where(Category.user_id == current_user.id)
        .order_by(Category.sort_order, Category.name)
    )
    categories = result.scalars().all()
    tree = _build_tree(list(categories))
    return CategoryTreeResponse(items=tree)


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    body: CategoryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.parent_id is not None:
        parent_result = await db.execute(
            select(Category).where(Category.id == body.parent_id, Category.user_id == current_user.id)
        )
        if parent_result.scalar_one_or_none() is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent category not found")

    category = Category(
        user_id=current_user.id,
        name=body.name,
        parent_id=body.parent_id,
        icon=body.icon,
        color=body.color,
        type=body.type,
        sort_order=body.sort_order,
    )
    db.add(category)
    await db.flush()
    await db.refresh(category)
    return CategoryResponse(
        id=category.id,
        user_id=category.user_id,
        name=category.name,
        parent_id=category.parent_id,
        icon=category.icon,
        color=category.color,
        type=category.type,
        sort_order=category.sort_order,
        children=[],
    )


@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Category).where(Category.id == category_id, Category.user_id == current_user.id)
    )
    category = result.scalar_one_or_none()
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    children_result = await db.execute(
        select(Category).where(Category.parent_id == category_id, Category.user_id == current_user.id)
    )
    children = children_result.scalars().all()

    return CategoryResponse(
        id=category.id,
        user_id=category.user_id,
        name=category.name,
        parent_id=category.parent_id,
        icon=category.icon,
        color=category.color,
        type=category.type,
        sort_order=category.sort_order,
        children=[
            CategoryResponse(
                id=c.id,
                user_id=c.user_id,
                name=c.name,
                parent_id=c.parent_id,
                icon=c.icon,
                color=c.color,
                type=c.type,
                sort_order=c.sort_order,
                children=[],
            )
            for c in children
        ],
    )


@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: uuid.UUID,
    body: CategoryUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Category).where(Category.id == category_id, Category.user_id == current_user.id)
    )
    category = result.scalar_one_or_none()
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    update_data = body.model_dump(exclude_unset=True)
    if "parent_id" in update_data and update_data["parent_id"] is not None:
        if update_data["parent_id"] == category_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category cannot be its own parent")
        parent_result = await db.execute(
            select(Category).where(Category.id == update_data["parent_id"], Category.user_id == current_user.id)
        )
        if parent_result.scalar_one_or_none() is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent category not found")

    for key, value in update_data.items():
        setattr(category, key, value)
    await db.flush()
    await db.refresh(category)

    return CategoryResponse(
        id=category.id,
        user_id=category.user_id,
        name=category.name,
        parent_id=category.parent_id,
        icon=category.icon,
        color=category.color,
        type=category.type,
        sort_order=category.sort_order,
        children=[],
    )


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Category).where(Category.id == category_id, Category.user_id == current_user.id)
    )
    category = result.scalar_one_or_none()
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    # Unparent children instead of deleting them
    children_result = await db.execute(
        select(Category).where(Category.parent_id == category_id)
    )
    for child in children_result.scalars().all():
        child.parent_id = category.parent_id

    await db.delete(category)
    await db.flush()
