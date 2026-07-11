# Architecture

## Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Backend** | NestJS + TypeScript | Enterprise framework; built-in DI; opinionated structure — fewer low-level decisions |
| **Database** | PostgreSQL + TypeORM | Relational fit; migration support; indexes for 10k-scale queries |
| **Frontend** | React + Vite + TypeScript + shadcn/ui + Tailwind | Fast dev, simple SPA — no SSR needed for internal HR tool |
| **Design system** | Harbor Ink (`presentation/styles/`) | Shared tokens for color, type, space, radius, shadow, motion — see development plan § Design system |
| **Tests** | Jest (NestJS) + Vitest (shared domain) | Fast unit tests on business logic |
| **API docs** | `@nestjs/swagger` (OpenAPI 3) | Auto-generated spec + Swagger UI; Bearer auth for protected routes |
| **Deploy** | Static host / Netlify (`frontend/`) + Railway/Render (`backend/` + Postgres) | SPA build; backend API separately |

## Toolchain

| Tool | Choice | Notes |
|------|--------|-------|
| **Node.js** | v24 (latest) | Pinned via root `.nvmrc` |
| **Version manager** | nvm | Run `nvm use` at repo root before working in either app |
| **Package manager** | Yarn | Both `backend/` and `frontend/` use Yarn (`yarn.lock` per app) |

```bash
nvm use                              # reads .nvmrc → Node 24
cd backend && yarn install && yarn start:dev
cd frontend && yarn install && yarn dev   # Vite dev server (default :5173)
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
│   │   ├── salary/                # SalaryRecord — assign, commit from draft, history, migrate
│   │   ├── salary-drafts/         # Draft create/update, commit, rollback
│   │   ├── currency-rates/        # FX sync (ExchangeRate-API) → DB
│   │   ├── dashboard/             # Aggregates; display-currency filter
│   │   ├── settings/              # Config + demo (seed, clear all)
│   │   └── demo/                  # Seed & clear-all logic (used by settings)
│   └── main.ts
└── ...
```

Each feature module owns its **controller**, **service**, **entities**, and **DTOs**. Domain rules live in services; TypeORM entities map to Postgres.

---

## Domain Model

```
Employee ──< SalaryRecord >── SalaryTemplate
    │              │
 currentSalaryId    └── snapshots at write (stock price, FX used)
    │
    └──< SalaryDraft (1 per employee, separate table)
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
| paymentCycle | string | App enum validated: `Monthly \| BiWeekly \| Weekly \| Annual` — stored as varchar, not PG enum |
| components | jsonb | `{ allowances?, bonus?, stock?: { quantity, vestingDate? } }` |
| totalCompensation | decimal(15,2) | Stored at write time, in `currency` |
| stockPriceAtEntry | decimal(15,2) \| null | Snapshot of `Settings.stockPrice` at write |
| stockPriceCurrencyAtEntry | string \| null | Snapshot of `Settings.stockPriceCurrency` at write |
| stockValueInStockCurrency | decimal(15,2) \| null | `quantity × stockPriceAtEntry` |
| stockValueInSalaryCurrency | decimal(15,2) \| null | Stock value converted to employee `currency` at write |
| fxRateUsed | decimal(10,6) \| null | FX rate used for stock → salary currency conversion |
| reason | string \| null | |
| createdBy | string | HR username from JWT |

Index: `(employeeId, effectiveDate DESC)`.

### SalaryDraft
Pending salary change — separate table, one draft per employee. Not visible in active salary until committed.

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| employeeId | UUID | FK → Employee, **unique** (one draft per employee) |
| templateId | UUID \| null | FK → SalaryTemplate |
| effectiveDate | date | |
| baseSalary | decimal(15,2) | |
| currency | string | |
| paymentCycle | string | App enum validated |
| components | jsonb | Same shape as SalaryRecord |
| stockPriceAtEntry | decimal \| null | Snapshot at draft save |
| stockPriceCurrencyAtEntry | string \| null | |
| stockValueInStockCurrency | decimal \| null | |
| stockValueInSalaryCurrency | decimal \| null | |
| fxRateUsed | decimal \| null | |
| reason | string \| null | |
| createdBy | string | |
| updatedAt | timestamp | Last draft edit |

Unique constraint: `(employeeId)` — only one active draft per employee.

### CurrencyRate
FX rates synced from ExchangeRate-API and stored in DB.

| Field | Type | Notes |
|-------|------|-------|
| id | UUID | PK |
| baseCurrency | string | e.g. `USD` — matches Settings.baseCurrency |
| targetCurrency | string | ISO 4217 code |
| rate | decimal(10,6) | 1 baseCurrency = `rate` targetCurrency (from API `conversion_rates`) |
| syncedAt | timestamp | Last sync time |

Unique constraint: `(baseCurrency, targetCurrency)`.

**Active salary:** `Employee.currentSalaryId` → direct FK lookup. Updated on every assign/edit.

**History:** All `SalaryRecord` for an employee, ordered by `effectiveDate DESC`.

### Settings (singleton, id = 1)
| Field | Purpose |
|-------|---------|
| baseCurrency | Base for FX sync and optional dashboard display filter |
| supportedCurrencies | `string[]` — available for salary assignment |
| supportedCountries | `string[]` — available for employee assignment |
| totalStocks | Org-wide stock pool (backend-updatable) |
| stockPrice | Current unit price per stock |
| stockPriceCurrency | Currency of stock price |
| lastFxSyncAt | timestamp \| null — last successful ExchangeRate-API sync |

---

## Key Logic

**Active salary:** `Employee.currentSalaryId` → direct FK lookup; updated on **commit** from draft.

**Salary history:** All committed `SalaryRecord` rows, ordered by `effectiveDate DESC`.

**Draft workflow:** Assign or edit salary → upsert `SalaryDraft` (one per employee) → visible on **Drafts** page → HR commits (creates `SalaryRecord`, updates `currentSalaryId`, deletes draft) or rollbacks (deletes draft).

**Total compensation (stored at write, in employee currency):**
`baseSalary + allowances + bonus + stockValueInSalaryCurrency`

**Stock snapshots at write:** Capture `stockPrice`, `stockPriceCurrency` from Settings; compute `stockValueInStockCurrency` and `stockValueInSalaryCurrency` using `CurrencyRate` from DB; store `fxRateUsed`.

**Currency display — no auto-conversion in listings:**
- Employee directory and detail → always show `totalCompensation` in `SalaryRecord.currency` (original).
- Dashboard → **Active employees only**; no Left employees.
- Dashboard supports `displayCurrency` filter: `original` (group/break down by native currency) or a supported currency (convert using DB rates for display only).

**paymentCycle:** TypeScript app enum (`PaymentCycle`); validated in DTO/service; stored as `varchar` in DB — no PostgreSQL enum type.

**FX rates:** Synced via `POST /settings/currency-rates/sync` → calls ExchangeRate-API → upserts `currency_rates` table. Settings UI shows rate table + **Sync** button.

**Template migration:** From template detail page; option `preserveFields[]` — keep existing employee salary field values, apply template values only for non-preserved fields.

---

## API Surface

| Module | Endpoints |
|--------|-----------|
| Auth | `POST /auth/login` |
| Employees | `GET/POST /employees`, `GET/PATCH /employees/:id`, `POST /employees/:id/relieve`, `GET /employees/left` |
| Salary Templates | `GET/POST /salary-templates`, `POST /salary-templates/:id/versions`, `GET /salary-templates/:id`, `POST /salary-templates/:id/migrate` |
| Salary Drafts | `POST /employees/:id/salary/draft`, `GET /salary-drafts`, `GET /salary-drafts/:id`, `POST /salary-drafts/:id/commit`, `DELETE /salary-drafts/:id` |
| Salary | `POST /employees/:id/salary` (assign → draft), `GET /employees/:id/salary/history` |
| Currency Rates | `GET /settings/currency-rates`, `POST /settings/currency-rates/sync` |
| Dashboard | `GET /dashboard/summary`, `/by-country`, `/distribution`, `/trends`, `/recent-revisions` — query: `displayCurrency`, `from`, `to` |
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
| `GET /dashboard/summary` | `{ totalPayroll, averageCompensation, activeEmployeeCount }` — per `displayCurrency` filter |
| `GET /dashboard/by-country` | `[{ country, payroll, headcount, currency }]` |
| `GET /dashboard/distribution` | `[{ range, count }]` — fixed buckets in selected display currency |
| `GET /dashboard/trends` | `[{ date, totalPayroll }]` — query: `from`, `to` (date range) |
| `GET /dashboard/recent-revisions` | Latest committed salary changes, paginated |

**`displayCurrency` query param:** `original` (breakdown by native currency, no cross-currency sum) or any supported currency (convert via DB rates for display).

---

## Frontend Structure

React SPA built with **Vite**. Client-side routing via **React Router**. No SSR.

**Design system:** Harbor Ink — tokens in `src/presentation/styles/` (`theme.css`, `animations.css`, `tokens.ts`). Brand teal `#0d7377`, accent gold `#d4a017`, fonts Fraunces + Sora. Frontend agent must reuse these tokens (no ad-hoc palettes).

```
frontend/
├── package.json
├── vite.config.ts
├── index.html
├── yarn.lock
├── src/
│   ├── app/                   # App entry, providers
│   ├── infrastructure/        # store, routing, RTK Query APIs
│   ├── domain/                # types, formatters
│   ├── presentation/
│   │   ├── styles/            # Harbor Ink theme + motion tokens
│   │   ├── components/        # layout + shadcn ui/
│   │   ├── pages/
│   │   └── hooks/
│   ├── main.tsx
│   └── index.css              # imports Tailwind + theme
└── ...
```

**Routes:**

| Path | Page | Auth |
|------|------|------|
| `/login` | LoginPage | Public |
| `/dashboard` | DashboardPage | Protected |
| `/employees` | EmployeesPage (Active only; salary in original currency) | Protected |
| `/employees/left` | LeftEmployeesPage (notice: excluded from dashboard) | Protected |
| `/employees/:id` | EmployeeDetailPage | Protected |
| `/employees/:id/salary/create` | AssignSalaryPage → saves draft | Protected |
| `/employees/:id/salary/edit` | EditSalaryPage → saves draft | Protected |
| `/drafts` | DraftsPage — commit or rollback pending changes | Protected |
| `/settings` | SettingsPage (FX table + Sync, stock, demo) | Protected |

---

## Performance (10k employees)

| Concern | Approach |
|---------|----------|
| Employee list | Server pagination; indexes on `name`, `email`, `country`, `status` |
| Active salary | `Employee.currentSalaryId` FK — direct lookup, no window function needed |
| Dashboard | SQL aggregates; `displayCurrency` filter; Active only |
| FX rates | `currency_rates` table; sync on demand via ExchangeRate-API |
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
│   ├── vite.config.ts
│   ├── index.html
│   ├── yarn.lock
│   └── src/
└── README.md
```

| App | Install | Run |
|-----|---------|-----|
| Backend | `cd backend && yarn install` | `yarn start:dev` |
| Frontend | `cd frontend && yarn install` | `yarn dev` (Vite, :5173) |

- OpenAPI spec at `backend` `/api/docs-json` — API contract source of truth
- Frontend `VITE_API_URL` points to backend (local or deployed)
- Submission: single repository link

---

## Auth

Minimal single-user login (env-based credentials). `POST /auth/login` returns JWT. All other routes protected by `JwtAuthGuard` + `@ApiBearerAuth()` in Swagger.

- **Backend:** Passport JWT strategy; global guard with `@Public()` decorator on login
- **Swagger:** Bearer auth scheme registered in `DocumentBuilder`; Authorize button in UI
- **Frontend:** Store token on login; `api.ts` sends `Authorization: Bearer <token>` on every request
- Landing page is public; API docs (`/api/docs`) available in dev/staging for assessors
