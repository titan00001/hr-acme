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
│   │   ├── salary-assignments/
│   │   ├── salary-revisions/
│   │   ├── dashboard/         # Aggregates, normalized reporting
│   │   ├── settings/          # Config + demo (seed, clear all)
│   │   └── demo/              # Seed & clear-all logic (used by settings)
│   └── main.ts
└── ...
```

Each feature module owns its **controller**, **service**, **entities**, and **DTOs**. Domain rules live in services; TypeORM entities map to Postgres.

---

## Domain Model

### Employee
| Field | Type |
|-------|------|
| id | UUID |
| employeeId | string (org identifier) |
| name | string |
| email | string |
| country | string |
| employmentType | Permanent \| Part-time \| Contract |
| status | Active \| Left |
| joiningDate | date |

### SalaryTemplate
Versioned, immutable compensation package. Assignments reference a specific version.

| Field | Type |
|-------|------|
| id | UUID |
| name | string (template family — shared across versions) |
| version | number (incremented per new version) |
| country | string |
| currency | string |
| components | JSON — e.g. `{ basePay, allowances, bonus }` |
| assigned | boolean (computed — true if any employee references this version) |

Once `assigned = true`, the template version cannot be modified. Create a new version instead.

### SalaryAssignment
Links employee to a template for a date range.

| Field | Type |
|-------|------|
| employeeId | FK → Employee |
| templateId | FK → SalaryTemplate |
| effectiveFrom | date |
| effectiveTo | date \| null (open-ended = current) |

### SalaryRevision
Append-only compensation change record.

| Field | Type |
|-------|------|
| employeeId | FK → Employee |
| effectiveDate | date |
| baseSalary | decimal |
| components | JSON |
| reason | string |
| createdBy | string |

### StockComponent
Optional per-employee stock grant on assignment or revision.

| Field | Type |
|-------|------|
| quantity | number |
| vesting | string |
| grantDate | date |

### Settings (singleton)
| Field | Purpose |
|-------|---------|
| baseCurrency | Reporting currency for dashboard normalization |
| fxRates | `{ [currency]: rate }` — manual rates vs base currency |
| totalStocks | Organization-wide total stock pool (backend-updatable) |
| stockPrice | Unit price per stock |
| stockPriceCurrency | Currency in which `stockPrice` is denominated |

---

## Key Logic

**Active assignment:** Latest assignment where `effectiveFrom ≤ today` and (`effectiveTo` is null or `effectiveTo ≥ today`).

**Active revision:** Latest revision where `effectiveDate ≤ today` (supplements or overrides template values per business rules).

**Total compensation:** Sum of `baseSalary` + component values + stock value (`quantity × stockPrice`, converted from `stockPriceCurrency` via `fxRates` when needed).

**Currency normalization:** `normalizedAmount = originalAmount × fxRates[originalCurrency]`.

---

## API Surface

| Module | Endpoints |
|--------|-----------|
| Auth | `POST /auth/login` |
| Employees | `GET/POST /employees`, `GET/PATCH /employees/:id`, `POST /employees/:id/relieve` |
| Salary Templates | `GET/POST /salary-templates`, `POST /salary-templates/:id/versions`, `GET /salary-templates/:id` |
| Template Migration | `POST /employees/:id/migrate-template`, `POST /employees/migrate-template/bulk` |
| Salary Assignments | `POST /employees/:id/assignments`, `GET /employees/:id/assignments` |
| Salary Revisions | `POST /employees/:id/revisions`, `GET /employees/:id/revisions` |
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
| Active salary | Query latest assignment/revision per employee via SQL window or denormalized pointer |
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
