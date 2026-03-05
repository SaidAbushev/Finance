"""
Default category seed data.

Called when a user registers to populate their account with standard categories.
Can also be run standalone: python -m app.infrastructure.seed
"""

import asyncio
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.category import Category, CategoryType


# (name, icon, color, children)
EXPENSE_CATEGORIES: list[tuple[str, str, str, list[tuple[str, str, str]]]] = [
    ("Еда", "utensils", "#ef4444", [
        ("Продукты", "shopping-cart", "#ef4444"),
        ("Рестораны", "utensils", "#f97316"),
        ("Кафе", "coffee", "#f59e0b"),
    ]),
    ("Транспорт", "car", "#3b82f6", [
        ("Бензин", "fuel", "#3b82f6"),
        ("Общественный", "bus", "#6366f1"),
        ("Такси", "car", "#8b5cf6"),
    ]),
    ("Жильё", "home", "#10b981", [
        ("Аренда", "key", "#10b981"),
        ("Коммунальные", "zap", "#14b8a6"),
        ("Ремонт", "tool", "#06b6d4"),
    ]),
    ("Здоровье", "heart", "#ec4899", [
        ("Аптека", "pill", "#ec4899"),
        ("Врачи", "stethoscope", "#f43f5e"),
        ("Спорт", "dumbbell", "#d946ef"),
    ]),
    ("Развлечения", "gamepad", "#a855f7", [
        ("Кино", "film", "#a855f7"),
        ("Подписки", "tv", "#7c3aed"),
        ("Хобби", "palette", "#6d28d9"),
    ]),
    ("Одежда", "shirt", "#f97316", []),
    ("Образование", "book-open", "#0ea5e9", []),
    ("Подарки", "gift", "#e11d48", []),
]

INCOME_CATEGORIES: list[tuple[str, str, str]] = [
    ("Зарплата", "banknote", "#22c55e"),
    ("Фриланс", "laptop", "#10b981"),
    ("Инвестиции", "trending-up", "#14b8a6"),
    ("Подарки", "gift", "#06b6d4"),
]


async def create_default_categories(session: AsyncSession, user_id: uuid.UUID) -> None:
    """Create default expense and income categories for a newly registered user."""
    # Check if user already has categories
    result = await session.execute(
        select(Category.id).where(Category.user_id == user_id).limit(1)
    )
    if result.scalar_one_or_none() is not None:
        return

    order = 0

    # Create expense categories
    for name, icon, color, children in EXPENSE_CATEGORIES:
        parent = Category(
            user_id=user_id,
            name=name,
            icon=icon,
            color=color,
            type=CategoryType.EXPENSE,
            sort_order=order,
        )
        session.add(parent)
        await session.flush()
        order += 1

        for child_name, child_icon, child_color in children:
            child = Category(
                user_id=user_id,
                name=child_name,
                parent_id=parent.id,
                icon=child_icon,
                color=child_color,
                type=CategoryType.EXPENSE,
                sort_order=order,
            )
            session.add(child)
            order += 1

    # Create income categories
    for name, icon, color in INCOME_CATEGORIES:
        cat = Category(
            user_id=user_id,
            name=name,
            icon=icon,
            color=color,
            type=CategoryType.INCOME,
            sort_order=order,
        )
        session.add(cat)
        order += 1


async def _main() -> None:
    """Standalone runner — seeds categories for all users that don't have any."""
    from app.infrastructure.database import async_session
    from app.domain.models.user import User

    async with async_session() as session:
        result = await session.execute(select(User.id))
        user_ids = result.scalars().all()

        for uid in user_ids:
            await create_default_categories(session, uid)

        await session.commit()
        print(f"Seed complete. Checked {len(user_ids)} user(s).")


if __name__ == "__main__":
    asyncio.run(_main())
