# AGENTS.md

## Architecture

Two independent apps wired together via Docker Compose + Nginx gateway. No shared code or build system.

```
backend/    Python 3.12 / FastAPI / SQLAlchemy 2.0 async / PostgreSQL 16
frontend/   React 19 / TypeScript 5.6 / Vite 6 / Tailwind CSS v4
nginx/      Reverse proxy config (not a service you edit often)
```

Nginx routes: `/api/` → backend:8000, `/uploads/` → volume, `/` → frontend:80.

---

## Running the Stack

```bash
# Full stack (requires .env copied from .env.example)
docker compose up --build

# Backend startup order (hardcoded in Dockerfile ENTRYPOINT):
alembic upgrade head && python seed.py && uvicorn app.main:app --host 0.0.0.0 --port 8000
```

First-run seeds an admin user using `FIRST_ADMIN_*` env vars (default: `admin` / `Admin@12345!`).

---

## Local Development (without Docker)

**Backend** — set `DATABASE_URL`, `SECRET_KEY`, etc., then from `backend/`:
```bash
alembic upgrade head
python seed.py
uvicorn app.main:app --reload
```

**Frontend** — from `frontend/`:
```bash
npm install
npm run dev       # Vite HMR dev server
npm run build     # tsc -b && vite build  (type-checks first)
npm run lint      # ESLint v9 flat config
```

---

## No Tests Exist

Zero test files anywhere. No Vitest, Jest, Playwright, or pytest installed. Do not assume a test command works.

---

## Alembic Migrations

- `alembic.ini` sets `sqlalchemy.url = placeholder`; `alembic/env.py` overrides it at runtime using `settings.DATABASE_URL`, swapping `+asyncpg` → `+psycopg2` for the synchronous Alembic runner.
- Generate a new migration from `backend/`:
  ```bash
  alembic revision --autogenerate -m "description"
  ```
- Currently one migration file: `0001_initial.py` (full schema).

---

## Known Type Inconsistencies

- `textarea` field type exists in `frontend/src/types/index.ts` but **not** in the backend `FieldType` enum.
- `special` `UserRole` exists in the backend enum but the frontend `UserRole` type only declares `'admin' | 'user'`.

Keep these in sync when modifying field types or user roles.

---

## Frontend Conventions

- Import alias `@/` maps to `src/` — always use it for non-relative imports.
- Types in `src/types/index.ts` are **manually maintained** mirrors of backend Pydantic schemas — no codegen. Update both sides together.
- Tailwind CSS v4 uses `@tailwindcss/vite` plugin — **no** `tailwind.config.js`.
- ESLint v9 flat config (`eslint.config.js`); `recommendedTypeChecked` is not enabled yet (documented as a future upgrade).
- TSC is type-check only (`noEmit: true`); Vite handles bundling.
- `VITE_API_URL` is baked into the frontend build as a Docker build arg — changing it requires a rebuild.

---

## Backend Conventions

- All routes prefixed `/api`; Swagger UI at `/api/docs`, ReDoc at `/api/redoc`.
- Async SQLAlchemy throughout (`AsyncSession`); dependency-injected via `app/core/deps.py`.
- Password policy enforced in `app/core/security.py`: min 8 chars, requires upper, lower, digit, special char.
- Users must have `is_confirmed=True` **and** `is_active=True` to authenticate.
- File uploads stored in `/app/uploads` volume (max `MAX_UPLOAD_SIZE_MB`, default 10 MB); Nginx `client_max_body_size 15M` provides headroom for multipart overhead.

---

## Environment Variables

Copy `.env.example` to `.env` before running. Required values with no default:
- `POSTGRES_PASSWORD`
- `SECRET_KEY` — generate with `openssl rand -hex 32`

`CORS_ORIGINS` is a comma-separated list. Default points to the production domain.

---

## No CI / No Pre-commit Hooks

No `.github/workflows/`, no Husky, no lint-staged. Nothing enforces lint or type-check before commits.
