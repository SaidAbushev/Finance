.PHONY: help up down build restart logs logs-backend logs-frontend \
       db-shell migrate seed dev-backend dev-frontend dev install \
       lint build-frontend clean

# ─────────────────────────────────────────────
#  Docker Compose
# ─────────────────────────────────────────────

help: ## Показать справку
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

up: ## Запустить все сервисы (Docker Compose)
	docker compose up -d

down: ## Остановить все сервисы
	docker compose down

build: ## Собрать Docker-образы
	docker compose build

rebuild: ## Пересобрать образы без кэша
	docker compose build --no-cache

restart: ## Перезапустить все сервисы
	docker compose restart

restart-backend: ## Перезапустить только backend
	docker compose restart backend

restart-frontend: ## Перезапустить только frontend
	docker compose restart frontend

logs: ## Показать логи всех сервисов
	docker compose logs -f --tail=50

logs-backend: ## Логи backend
	docker compose logs -f --tail=50 backend

logs-frontend: ## Логи frontend
	docker compose logs -f --tail=50 frontend

ps: ## Статус сервисов
	docker compose ps

# ─────────────────────────────────────────────
#  База данных
# ─────────────────────────────────────────────

db-shell: ## Подключиться к PostgreSQL
	docker compose exec db psql -U finance -d finance

migrate: ## Применить миграции (в Docker)
	docker compose exec backend alembic upgrade head

migrate-new: ## Создать новую миграцию (NAME=описание)
	docker compose exec backend alembic revision --autogenerate -m "$(NAME)"

seed: ## Засеять дефолтные данные
	docker compose exec backend python -m app.infrastructure.seed

# ─────────────────────────────────────────────
#  Локальная разработка (без Docker)
# ─────────────────────────────────────────────

install: ## Установить зависимости (backend + frontend)
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

dev-backend: ## Запустить backend локально (нужен PostgreSQL)
	cd backend && PYTHONPATH=. uvicorn app.main:app --reload --port 8000

dev-frontend: ## Запустить frontend локально
	cd frontend && npm run dev

dev: ## Запустить backend + frontend параллельно (локально)
	@echo "Запуск backend на :8000 и frontend на :5173"
	@make dev-backend & make dev-frontend

migrate-local: ## Применить миграции локально
	cd backend && PYTHONPATH=. alembic upgrade head

seed-local: ## Засеять данные локально
	cd backend && PYTHONPATH=. python -m app.infrastructure.seed

# ─────────────────────────────────────────────
#  Сборка и проверка
# ─────────────────────────────────────────────

lint: ## Проверить типы (TypeScript)
	cd frontend && npx tsc --noEmit

build-frontend: ## Собрать frontend для production
	cd frontend && npm run build

check-python: ## Проверить синтаксис Python
	cd backend && python -c "import ast,pathlib; [ast.parse(f.read_text()) for f in pathlib.Path('app').rglob('*.py')]; print('OK')"

check: lint check-python ## Все проверки

# ─────────────────────────────────────────────
#  Очистка
# ─────────────────────────────────────────────

clean: ## Остановить сервисы и удалить volumes
	docker compose down -v
	rm -rf frontend/dist frontend/node_modules/.vite
