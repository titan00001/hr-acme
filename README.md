# ACME HR Salary Management

Internal web app for ACME's HR Manager to manage compensation for ~10,000 employees across countries — replacing spreadsheets with searchable records, a draft-first salary workflow, and org-wide analytics.

---

## Prerequisites

- **Node.js v24** via nvm — run `nvm use` at repo root
- **Yarn** — `corepack enable` if not available
- **PostgreSQL** running locally
- **ExchangeRate-API key** (free tier) for FX sync

---

## Setup

### Backend

```bash
cd backend
cp .env.example .env          # fill in DATABASE_URL, JWT_SECRET, HR credentials, EXCHANGE_RATE_API_KEY
yarn install
yarn migration:run             # creates all tables
yarn start:dev                 # http://localhost:3001
```

API docs (Swagger UI): **http://localhost:3001/api/docs**

### Frontend

```bash
cd frontend
cp .env.example .env           # VITE_API_URL=http://localhost:3001
yarn install
yarn dev                       # http://localhost:5173
```

---

## Demo Walkthrough

1. **Login** — use credentials from `backend/.env` (`HR_USERNAME` / `HR_PASSWORD`)
2. **Seed demo data** — Settings → Demo → **Seed** (~10,000 employees with salary history)
3. **Explore the employee directory** — search, filter by country/type, paginate
4. **Onboard an employee** — Employees → Onboard; no salary until assigned
5. **Assign salary** — employee detail → Assign Salary → fills a draft
6. **Commit the draft** — Drafts page → Commit; creates an immutable SalaryRecord
7. **Edit salary** — employee detail → Edit Salary → updates the draft; commit again
8. **Relieve employee** — employee detail → Relieve; moves to Left Employees (excluded from dashboard)
9. **Dashboard** — payroll totals, by-country breakdown, distribution, trends; use `displayCurrency` filter
10. **Settings** — manage FX rates (Sync), stock config, supported countries/currencies

---

## Key Features

| Feature | Details |
|---------|---------|
| Employee management | CRUD, onboard, relieve; Active / Left status |
| Draft-first salary workflow | Assign/edit → SalaryDraft → commit → immutable SalaryRecord |
| Salary templates | Versioned blueprints; immutable once used; bulk migrate to new version |
| Dashboard analytics | Payroll totals, country breakdown, distribution, trends — Active employees only |
| Currency | FX rates from ExchangeRate-API; display-only conversion on dashboard |
| Stock snapshots | Price + FX rate captured at every commit for audit |
| Demo seeder | Seed/clear ~10k employees for live demos |

---

## Running Tests

```bash
# Backend unit tests
cd backend && yarn test

# Backend e2e tests (supertest, in-memory mocks — no DB required)
cd backend && yarn test:e2e

# Frontend unit tests (Vitest)
cd frontend && yarn test

# Frontend e2e / smoke tests (Playwright — requires running backend + frontend)
cd frontend && yarn test:e2e
```

---

## Architecture

| Layer | Choice |
|-------|--------|
| Backend | NestJS 11 + TypeScript, hexagonal architecture |
| Database | PostgreSQL + TypeORM, 8 migrations |
| Frontend | React 19 + Vite + RTK Query + Tailwind CSS 4 |
| Auth | JWT (single HR user, env-based credentials) |
| API docs | Swagger UI at `/api/docs` |

See [`docs/architecture.md`](docs/architecture.md) for domain model, module structure, and full API surface.

---

## Docs

| File | Purpose |
|------|---------|
| [`docs/requirements.md`](docs/requirements.md) | What was built and why |
| [`docs/architecture.md`](docs/architecture.md) | Stack, domain model, API surface |
| [`docs/business-specification.md`](docs/business-specification.md) | Business rules (salary lifecycle, templates, FX) |
| [`docs/ai-approach.md`](docs/ai-approach.md) | How AI was used during development |
| [`docs/deployment-runbook.md`](docs/deployment-runbook.md) | Deploy frontend (Vercel) + backend (Railway) |
