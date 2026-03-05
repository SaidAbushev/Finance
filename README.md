# Финансы — Управление личным бюджетом

Веб-приложение для учёта личных финансов, вдохновлённое MoneyWiz. Позволяет вести счета, отслеживать транзакции, контролировать бюджеты и анализировать расходы.

## Стек технологий

### Backend
- **Python 3.13** + **FastAPI** — асинхронный REST API
- **SQLAlchemy 2.x** (async) — ORM с поддержкой DDD
- **PostgreSQL 16** — основная база данных
- **Alembic** — миграции
- **JWT** (python-jose) — аутентификация
- **Pydantic v2** — валидация данных

### Frontend
- **React 18** + **TypeScript** + **Vite**
- **TanStack Query v5** — серверное состояние
- **Zustand** — клиентское состояние
- **React Hook Form** + **Zod** — формы и валидация
- **Tailwind CSS** — стилизация
- **Recharts** — графики и отчёты
- **Lucide React** — иконки

### Инфраструктура
- **Docker Compose** — оркестрация сервисов
- PostgreSQL, Backend, Frontend — три контейнера

## Быстрый старт

### Требования
- Docker и Docker Compose
- Make (опционально, для удобства)

### Запуск

```bash
git clone <repository-url>
cd Finance
make up          # или: docker compose up -d
```

После запуска:
- **Frontend**: http://localhost:5173
- **Backend API (Swagger)**: http://localhost:8000/docs
- **PostgreSQL**: localhost:5432

При первом запуске автоматически:
1. Создаётся база данных и применяются миграции
2. При регистрации пользователя создаются дефолтные категории на русском

### Остановка

```bash
make down        # или: docker compose down
make clean       # полная очистка, включая данные БД
```

## Make-команды

Все операции доступны через `make`. Для справки: `make help`.

### Docker Compose

| Команда | Описание |
|---------|----------|
| `make up` | Запустить все сервисы |
| `make down` | Остановить все сервисы |
| `make build` | Собрать Docker-образы |
| `make rebuild` | Пересобрать без кэша |
| `make restart` | Перезапустить всё |
| `make restart-backend` | Перезапустить backend |
| `make restart-frontend` | Перезапустить frontend |
| `make logs` | Логи всех сервисов (follow) |
| `make logs-backend` | Логи backend |
| `make logs-frontend` | Логи frontend |
| `make ps` | Статус контейнеров |

### База данных

| Команда | Описание |
|---------|----------|
| `make db-shell` | Подключиться к PostgreSQL (psql) |
| `make migrate` | Применить миграции (Docker) |
| `make migrate-new NAME="описание"` | Создать новую миграцию |
| `make seed` | Засеять дефолтные данные |

### Локальная разработка (без Docker)

| Команда | Описание |
|---------|----------|
| `make install` | Установить зависимости (backend + frontend) |
| `make dev` | Запустить backend + frontend параллельно |
| `make dev-backend` | Только backend (localhost:8000) |
| `make dev-frontend` | Только frontend (localhost:5173) |
| `make migrate-local` | Применить миграции локально |
| `make seed-local` | Засеять данные локально |

### Проверки и сборка

| Команда | Описание |
|---------|----------|
| `make check` | Все проверки (TypeScript + Python) |
| `make lint` | Проверить типы TypeScript |
| `make check-python` | Проверить синтаксис Python |
| `make build-frontend` | Собрать frontend для production |
| `make clean` | Остановить всё и удалить volumes |

## Функциональность

### Счета
- Типы: наличные, расчётный, сберегательный, кредитный, инвестиционный
- Автоматический расчёт баланса (начальный + сумма транзакций)
- Мультивалютность (RUB, USD, EUR, KZT)
- Архивирование

### Транзакции
- Три типа: расход, доход, перевод между счетами
- Splits — одна транзакция на несколько категорий/счетов
- Статусы: ожидание, проведена, сверена
- Фильтры: по счёту, категории, дате, текстовый поиск
- Cursor-пагинация для быстрой работы с большими объёмами

### Категории
- Древовидная структура (родительская → подкатегории)
- 12 дефолтных категорий расходов + 4 категории доходов
- Кастомные иконки и цвета

### Бюджеты
- Месячные бюджеты по категориям
- Отслеживание прогресса (потрачено / лимит)
- Навигация по месяцам

### Отчёты
- **Чистая стоимость** — график изменения за период (AreaChart)
- **Расходы по категориям** — круговая диаграмма + breakdown
- Пресетные периоды: месяц, 3/6 месяцев, год, всё время

### Импорт
- Загрузка CSV-файлов (drag-and-drop)
- Автоопределение разделителя и кодировки (UTF-8, CP1251)
- Предпросмотр перед подтверждением
- Поддержка русских форматов дат и чисел

## Архитектура

### Backend — Clean Architecture / DDD

```
backend/app/
├── api/v1/            # Presentation layer
│   ├── routes/        # HTTP endpoints
│   ├── schemas/       # Pydantic request/response models
│   └── deps.py        # Dependencies (auth, DB session)
├── domain/models/     # Domain layer — SQLAlchemy ORM models
└── infrastructure/    # Infrastructure layer
    ├── database.py    # Engine, session factory
    └── seed.py        # Default data
```

### Frontend — Feature-Sliced

```
frontend/src/
├── app/               # Routing, providers
├── pages/             # Page components
├── features/          # Vertical slices
│   ├── accounts/      # components, api, hooks, types
│   ├── transactions/
│   ├── categories/
│   ├── budgets/
│   └── reports/
└── shared/
    ├── ui/            # Design system (Button, Input, Dialog, Drawer...)
    ├── layout/        # Sidebar, TopBar, PageLayout
    ├── api/           # HTTP client, auth
    ├── hooks/         # Shared hooks
    └── lib/           # Утилиты (formatCurrency, formatDate)
```

## API

### Аутентификация
| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/v1/auth/register` | Регистрация |
| POST | `/api/v1/auth/login` | Вход |
| GET | `/api/v1/auth/me` | Текущий пользователь |

### Счета
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/v1/accounts` | Список счетов |
| POST | `/api/v1/accounts` | Создать счёт |
| GET | `/api/v1/accounts/{id}` | Получить счёт |
| PUT | `/api/v1/accounts/{id}` | Обновить счёт |
| DELETE | `/api/v1/accounts/{id}` | Удалить счёт |
| POST | `/api/v1/accounts/{id}/archive` | Архивировать/разархивировать |

### Транзакции
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/v1/transactions` | Список (фильтры, cursor-пагинация) |
| POST | `/api/v1/transactions` | Создать транзакцию |
| GET | `/api/v1/transactions/{id}` | Получить транзакцию |
| PUT | `/api/v1/transactions/{id}` | Обновить |
| DELETE | `/api/v1/transactions/{id}` | Удалить |

### Категории
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/v1/categories` | Дерево категорий |
| POST | `/api/v1/categories` | Создать категорию |
| PUT | `/api/v1/categories/{id}` | Обновить |
| DELETE | `/api/v1/categories/{id}` | Удалить |

### Бюджеты
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/v1/budgets` | Список бюджетов |
| POST | `/api/v1/budgets` | Создать бюджет |
| PUT | `/api/v1/budgets/{id}` | Обновить |
| DELETE | `/api/v1/budgets/{id}` | Удалить |
| GET | `/api/v1/budgets/{id}/progress` | Прогресс (year, month) |

### Отчёты
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/v1/reports/networth` | Чистая стоимость по месяцам |
| GET | `/api/v1/reports/category-spend` | Расходы по категориям |

### Импорт
| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/v1/import/upload` | Загрузить CSV |
| POST | `/api/v1/import/confirm` | Подтвердить импорт |

## Разработка

### Через Make (рекомендуется)

```bash
make install          # установить зависимости backend + frontend
make migrate-local    # применить миграции (нужен запущенный PostgreSQL)
make dev              # запустить backend :8000 + frontend :5173
```

### Вручную (без Make)

```bash
# Backend
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL=postgresql+asyncpg://finance:finance_secret@localhost:5432/finance
PYTHONPATH=. alembic upgrade head
PYTHONPATH=. uvicorn app.main:app --reload

# Frontend (в отдельном терминале)
cd frontend
npm install
npm run dev
```

### Переменные окружения

| Переменная | По умолчанию | Описание |
|------------|-------------|----------|
| `DATABASE_URL` | `postgresql+asyncpg://finance:finance_secret@db:5432/finance` | Подключение к БД |
| `SECRET_KEY` | `dev-secret-key-change-in-production` | Ключ для JWT |
| `CORS_ORIGINS` | `["http://localhost:5173"]` | Разрешённые origins |
| `VITE_API_URL` | `http://localhost:8000` | URL бэкенда для фронта |

## База данных

### Основные таблицы
- `users` — пользователи
- `accounts` — счета
- `categories` — категории (дерево через parent_id)
- `transactions` — транзакции
- `transaction_splits` — строки транзакций (ledger-подход)
- `budgets` / `budget_periods` — бюджеты

### Миграции

```bash
make migrate                        # применить (Docker)
make migrate-new NAME="описание"    # создать новую (Docker)
make migrate-local                  # применить (локально)

# Откатить
docker compose exec backend alembic downgrade -1
```

## Дальнейшее развитие (V1)

- [ ] Биллы и подписки (recurring transactions) + календарь
- [ ] Мультивалюта с историческими курсами
- [ ] Импорт OFX/QIF/MT940
- [ ] Правила автокатегоризации
- [ ] Вложения (чеки/фото)
- [ ] Семейный workspace (RBAC)
- [ ] Банковская интеграция (SaltEdge/Plaid)
- [ ] PWA / мобильная адаптация

## Лицензия

MIT
