# Architecture

## Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Backend** | NestJS + TypeScript | Enterprise framework; built-in DI; opinionated structure — fewer low-level decisions |
| **Database** | PostgreSQL + TypeORM | Relational fit; migration support; indexes for 10k-scale queries |
| **Frontend** | Next.js + TypeScript + shadcn/ui | JD requirement; polished HR UI quickly |
| **Tests** | Jest (NestJS) + Vitest (shared domain) | Fast unit tests on business logic |
| **API docs** | `@nestjs/swagger` (OpenAPI 3) | Auto-generated spec + Swagger UI; Bearer auth for protected routes |
| **Deploy** | Vercel (`frontend/`) + Railway/Render (`backend/` + Postgres) | Deploy each app independently |

## Toolchain

| Tool | Choice | Notes |
|------|--------|-------|
| **Node.js** | v24 (latest) | Pinned via root `.nvmrc` |
| **Version manager** | nvm | Run `nvm use` at repo root before working in either app |
| **Package manager** | Yarn | Both `backend/` and `frontend/` use Yarn (`yarn.lock` per app) |

```bash
nvm use                              # reads .nvmrc → Node 24
cd backend && yarn install && yarn start:dev
cd frontend && yarn install && yarn dev
```

Do not use npm. Enable Yarn via Corepack if needed: `corepack enable`.

## Backend Structure — Feature Modules

NestJS **feature-based modules** with a **shared/common** layer for cross-cutting concerns.

```
backend/
├── package.json
├── yarn.lock
├── src/
│   ├── common/                # Shared across features
│   │   ├── auth/              # JWT strategy, Bearer guard, @ApiBearerAuth
│   │   ├── database/          # TypeORM config, base entity
│   │   ├── currency/          # FX conversion service
│   │   ├── pagination/        # Shared DTOs, query helpers
│   │   └── swagger/           # OpenAPI setup, Bearer security scheme
│   ├── modules/
│   │   ├── auth/
│   │   ├── employees/         # CRUD, onboard, relieve
│   │   ├── salary-templates/
│   │   ├── salary/                # SalaryRecord — assign, revise, history, migrate
│   │   ├── dashboard/         # Aggregates, normalized reporting
│   │   ├── settings/          # Config + demo (seed, clear all)
│   │   └── demo/              # Seed & clear-all logic (used by settings)
│   └── main.ts
└── ...
```

Each feature module owns its **controller**, **service**, **entities**, and **DTOs**. Domain rules live in services; TypeORM entities map to Postgres.

---

## Domain Model

```
Employee ──< SalaryRecord >── SalaryTemplate
    │
 currentSalaryId (FK → latest SalaryRecord)
```

### Employee
| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| employeeId | string | Unique org identifier |
| name | string | |
| email | string | Unique |
| country | string | Must be in `Settings.supportedCountries` |
| employmentType | enum | `Permanent \| PartTime \| Contract` |
| status | enum | `Active \| Left` |
| joiningDate | date | |
| currentSalaryId | UUID \| null | FK → SalaryRecord (latest active) |

### SalaryTemplate
Versioned blueprint. Once used as a basis for any `SalaryRecord`, `isAssigned = true` and the version becomes immutable — create a new version for structural changes.

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| name | string | Template family name (shared across versions) |
| version | integer | Incremented per new version |
| country | string | |
| currency | string | |
| components | jsonb | `{ basePay, allowances?, bonus?, stock?: { quantity, vestingDate? } }` |
| isAssigned | boolean | True once referenced by any SalaryRecord |

Unique constraint: `(name, version)`.

### SalaryRecord
Every salary event — initial assignment or revision. Append-only. Stock stored inside `components` JSON.

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| employeeId | UUID | FK → Employee |
| templateId | UUID \| null | FK → SalaryTemplate (blueprint used, if any) |
| effectiveDate | date | |
| baseSalary | decimal(15,2) | |
| currency | string | |
| paymentCycle | enum | `Monthly \| BiWeekly \| Weekly \| Annual` |
| components | jsonb | `{ allowances?, bonus?, stock?: { quantity, vestingDate? } }` |
| totalCompensation | decimal(15,2) | Stored (computed at write time) |
| reason | string \| null | |
| createdBy | string | HR username from JWT |

Index: `(employeeId, effectiveDate DESC)`.

**Active salary:** `Employee.currentSalaryId` → direct FK lookup. Updated on every assign/edit.

**History:** All `SalaryRecord` for an employee, ordered by `effectiveDate DESC`.

### Settings (singleton, id = 1)
| Field | Purpose |
|-------|---------|
| baseCurrency | Reporting currency for dashboard normalization |
| fxRates | `{ [currency]: rate }` — 1 unit of currency → baseCurrency |
| supportedCurrencies | `string[]` — available for salary assignment |
| supportedCountries | `string[]` — available for employee assignment |
| totalStocks | Org-wide stock pool (backend-updatable) |
| stockPrice | Unit price per stock |
| stockPriceCurrency | Currency of stock price |

---

## Key Logic

**Active salary:** `Employee.currentSalaryId` → direct FK lookup; updated atomically on every assign/edit.

**Salary history:** All `SalaryRecord` rows for an employee, ordered by `effectiveDate DESC`.

**Total compensation (stored at write):** `baseSalary + components.allowances + components.bonus + (components.stock.quantity × stockPrice normalized to salary currency)`.

**Currency normalization (dashboard):** `normalizedAmount = originalAmount × fxRates[originalCurrency]`.

---

## API Surface

| Module | Endpoints |
|--------|-----------|
| Auth | `POST /auth/login` |
| Employees | `GET/POST /employees`, `GET/PATCH /employees/:id`, `POST /employees/:id/relieve` |
| Salary Templates | `GET/POST /salary-templates`, `POST /salary-templates/:id/versions`, `GET /salary-templates/:id` |
| Salary | `POST /employees/:id/salary` (assign), `PATCH /employees/:id/salary` (revise), `GET /employees/:id/salary/history` |
| Template Migration | `POST /employees/:id/salary/migrate`, `POST /salary/bulk-migrate` |
| Dashboard | `GET /dashboard/summary`, `/by-country`, `/distribution`, `/trends`, `/recent-revisions` |
| Settings | `GET/PATCH /settings` |
| Settings — Demo | `POST /settings/demo/seed`, `POST /settings/demo/clear`, `GET /settings/demo/status` |

OpenAPI spec and interactive docs served at `/api/docs` (Swagger UI). DTOs decorated with `@ApiProperty`; controllers with `@ApiTags`, `@ApiOperation`, `@ApiResponse`.

---

## API Documentation (Swagger)

| Item | Detail |
|------|--------|
| Package | `@nestjs/swagger` |
| UI | `/api/docs` — interactive Swagger UI |
| Spec | OpenAPI 3 JSON at `/api/docs-json` (for client generation) |
| Auth scheme | **Bearer JWT** — `Authorization: Bearer <token>` |
| Public routes | `POST /auth/login` only — no Bearer required |
| Protected routes | `@ApiBearerAuth()` + `JwtAuthGuard` on all other controllers |

**Swagger UI flow:** Login via `/auth/login` → copy JWT → click **Authorize** → paste token → call protected endpoints.

**Frontend API client:** `frontend/src/lib/api.ts` attaches Bearer token from login to all requests. OpenAPI spec can optionally generate typed client (`openapi-typescript` or `swagger-typescript-api`).

---

## Dashboard Metrics

Canonical metric list lives in [requirements.md](./requirements.md#dashboard--reporting). API response shapes:

| Endpoint | Returns |
|----------|---------|
| `GET /dashboard/summary` | `{ totalPayroll, averageCompensation, activeEmployeeCount }` — all in base currency |
| `GET /dashboard/by-country` | `[{ country, payroll, headcount }]` — per country, payroll normalized |
| `GET /dashboard/distribution` | `[{ range, count }]` — e.g. `"0–50k"`, `"50k–100k"` buckets |
| `GET /dashboard/trends` | `[{ period, totalPayroll }]` — monthly/quarterly from revision effective dates |
| `GET /dashboard/recent-revisions` | `[{ employeeId, employeeName, effectiveDate, reason, totalCompensation }]` — paginated, limit 20 |

All compensation values normalized via `CurrencyService` using Settings `baseCurrency` + `fxRates`.

---

## Frontend Structure

```
frontend/
├── package.json
├── yarn.lock
├── src/
│   ├── app/
│   │   ├── (public)/login/    # Landing + login
│   │   └── (auth)/            # Authenticated shell
│   │       ├── layout.tsx     # Header + Sidebar
│   │       ├── dashboard/
│   │       ├── employees/
│   │       ├── employees/onboard/
│   │       ├── employees/[id]/
│   │       ├── employees/[id]/salary/create/
│   │       ├── employees/[id]/salary/edit/
│   │       └── settings/      # General + Demo section (seed, clear all)
│   ├── components/
│   │   ├── layout/            # GlobalHeader, Sidebar
│   │   └── ui/                # shadcn
│   └── lib/
│       ├── api.ts             # Fetch wrapper with Bearer token
│       └── auth.ts            # Token storage from login
└── ...
```

---

## Performance (10k employees)

| Concern | Approach |
|---------|----------|
| Employee list | Server pagination; indexes on `name`, `email`, `country`, `status` |
| Active salary | `Employee.currentSalaryId` FK — direct lookup, no window function needed |
| Dashboard | SQL aggregates; normalize currency in service layer |
| Seed | Batch inserts (500–1000 rows/transaction); triggered from Settings → Demo |
| Clear all | Truncate employee/salary tables; retain Settings row |

---

## Repository Layout

**Single git repository.** Backend and frontend are independent apps within the repo — each has its own `package.json` and `yarn.lock`. No root `package.json` required.

```
hr-incubyte/
├── .nvmrc                     # Node 24
├── docs/                      # Requirements, architecture, business rules, AI approach
├── backend/
│   ├── package.json
│   ├── yarn.lock
│   └── src/
├── frontend/
│   ├── package.json
│   ├── yarn.lock
│   └── src/
└── README.md
```

| App | Install | Run |
|-----|---------|-----|
| Backend | `cd backend && yarn install` | `yarn start:dev` |
| Frontend | `cd frontend && yarn install` | `yarn dev` |

- OpenAPI spec at `backend` `/api/docs-json` — API contract source of truth
- Frontend `NEXT_PUBLIC_API_URL` points to backend (local or deployed)
- Submission: single repository link

---

## Auth

Minimal single-user login (env-based credentials). `POST /auth/login` returns JWT. All other routes protected by `JwtAuthGuard` + `@ApiBearerAuth()` in Swagger.

- **Backend:** Passport JWT strategy; global guard with `@Public()` decorator on login
- **Swagger:** Bearer auth scheme registered in `DocumentBuilder`; Authorize button in UI
- **Frontend:** Store token on login; `api.ts` sends `Authorization: Bearer <token>` on every request
- Landing page is public; API docs (`/api/docs`) available in dev/staging for assessors
