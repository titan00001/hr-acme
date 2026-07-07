# Technical Implementation Plan

## Finalized Domain Model

```
Employee ──< SalaryRecord >── SalaryTemplate
    │                              │
 currentSalaryId (FK)         version, components
    │
    └── currentSalary: SalaryRecord (denormalized for perf)
```

**SalaryTemplate** — blueprint with recommended component values. Versioned, immutable once an employee's salary has been based on it.

**SalaryRecord** — every salary event (initial assignment or revision). Employee's `currentSalaryId` always points to the latest. History = all records ordered by `effectiveDate DESC`.

**No SalaryAssignment entity** — the template → employee link is expressed by `SalaryRecord.templateId` (nullable; records which template was used as a blueprint, if any).

---

## Backend Modules

### Common — `src/common/`

#### `database/`
- `BaseEntity` — abstract entity with `id` (uuid v4), `createdAt`, `updatedAt`
- TypeORM `DataSource` config (loaded from env)
- Deps: `@nestjs/typeorm`, `typeorm`, `pg`

#### `auth/`
- `JwtStrategy` (Passport) — validates Bearer token, extracts payload
- `JwtAuthGuard` — global guard applied in `AppModule`
- `@Public()` decorator — skips guard on login route
- Deps: `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`

#### `currency/`
- `CurrencyService` (injectable, global)

| Method | Signature | Purpose |
|--------|-----------|---------|
| `normalize` | `(amount, from, to, fxRates) → number` | Convert amount between currencies |
| `normalizeSalary` | `(record: SalaryRecord, targetCurrency, fxRates) → number` | Normalize total compensation to base currency |

Reused by: `SalaryModule`, `DashboardModule`.

#### `pagination/`
| DTO | Fields |
|-----|--------|
| `PaginationQueryDto` | `page: number (default 1)`, `limit: number (default 20, max 100)`, `sortBy: string`, `sortOrder: 'ASC'\|'DESC'` |
| `PaginatedResponseDto<T>` | `data: T[]`, `total`, `page`, `limit`, `totalPages` |

Utils:
- `paginationMeta(total, page, limit)` → builds meta fields
- `safeOrderBy(sortBy, allowedFields, alias)` → whitelists sort columns, prevents injection

#### `swagger/`
- `DocumentBuilder` setup: title, description, version, Bearer JWT auth scheme
- Mounted in `main.ts` at `/api/docs` (UI) and `/api/docs-json` (spec)

---

## Environment Variables

### Backend — `backend/.env`

| Variable | Example | Required | Purpose |
|----------|---------|----------|---------|
| `NODE_ENV` | `development` | Yes | Runtime environment |
| `PORT` | `3001` | No (default 3001) | HTTP listen port |
| `DATABASE_URL` | `postgresql://user:pass@localhost:5432/hr_db` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | `a-long-random-string` | Yes | Signs JWT tokens |
| `JWT_EXPIRES_IN` | `8h` | No (default `8h`) | Token expiry |
| `HR_USERNAME` | `admin` | Yes | Single HR Manager login username |
| `HR_PASSWORD` | `changeme` | Yes | Single HR Manager login password |
| `FRONTEND_URL` | `http://localhost:3000` | Yes | Allowed CORS origin |

### Frontend — `frontend/.env.local`

| Variable | Example | Required | Purpose |
|----------|---------|----------|---------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Yes | Backend base URL for all API calls |

Both repos must include a `.env.example` committed to git (with placeholder values, never real secrets). `.env` and `.env.local` go in `.gitignore`.

---

## CORS Configuration

Backend `main.ts` must enable CORS before `app.listen()`:

```ts
app.enableCors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
});
```

`FRONTEND_URL` is `http://localhost:3000` in dev and the deployed Vercel URL in production. Without this, every browser request from the frontend will be blocked.

---

## Circular Module Dependency

`Employee` and `SalaryRecord` reference each other:
- `Employee.currentSalaryId` → FK to `SalaryRecord`
- `SalaryRecord.employeeId` → FK to `Employee`

At NestJS module level, `EmployeeModule` imports `SalaryModule` (needs `SalaryRecord` entity/repository), and `SalaryModule` imports `EmployeeModule` (needs `Employee` entity for validation). This creates a circular dependency.

**Resolution: `forwardRef()`**

```ts
// employee.module.ts
@Module({
  imports: [forwardRef(() => SalaryModule), SettingsModule],
  ...
})

// salary.module.ts
@Module({
  imports: [forwardRef(() => EmployeeModule), SalaryTemplateModule, SettingsModule],
  ...
})
```

And in services that inject the other service:

```ts
constructor(
  @Inject(forwardRef(() => SalaryService))
  private readonly salaryService: SalaryService,
) {}
```

**Alternative (preferred if possible):** Expose only the `SalaryRecord` *repository* (not the full `SalaryModule`) via `TypeOrmModule.forFeature([SalaryRecord])` inside `EmployeeModule`, so `EmployeeModule` doesn't need to import `SalaryModule` at all — only shares the entity. Then circular dependency only exists if `SalaryModule` calls `EmployeeService` methods (validation), which it does. So `forwardRef()` is required for that direction only.

---

### Module 1 — `auth`

**Purpose:** Issue JWT on login. Credentials from env only — no users table.

**Entity:** none

**DTOs:**

| DTO | Fields |
|-----|--------|
| `LoginRequestDto` | `username: string`, `password: string` |
| `LoginResponseDto` | `accessToken: string`, `expiresIn: number` |

**Service — `AuthService`:**
- `login(dto)` → compare against `process.env.HR_USERNAME` / `process.env.HR_PASSWORD` → sign JWT via `JwtService` → return `LoginResponseDto`
- Throws `UnauthorizedException` on mismatch

**Routes:**

| Method | Path | Guard | Description |
|--------|------|-------|-------------|
| `POST` | `/auth/login` | `@Public()` | Returns JWT |

---

### Module 2 — `employees`

**Purpose:** Employee lifecycle — directory, onboard, update, relieve.

**Entity — `Employee`:**

| Field | Type | Constraints |
|-------|------|-------------|
| id | uuid | PK |
| employeeId | string | unique, not null |
| name | string | not null |
| email | string | unique, not null |
| country | string | not null |
| employmentType | enum | `Permanent \| PartTime \| Contract` |
| status | enum | `Active \| Left` default `Active` |
| joiningDate | date | not null |
| currentSalaryId | uuid | FK → SalaryRecord, nullable |

Indexes: `(name)`, `(email)`, `(country)`, `(status)`, `(employmentType)`, composite `(country, status)`.

**Dependencies:** `SettingsModule` (validate country exists in `settings.countries`), `TypeORM` lazy relation to `SalaryRecord`.

**DTOs:**

| DTO | Fields |
|-----|--------|
| `CreateEmployeeDto` | `employeeId`, `name`, `email`, `country`, `employmentType`, `joiningDate` (all required) |
| `UpdateEmployeeDto` | All fields optional (Partial of Create minus employeeId) |
| `RelieveEmployeeDto` | `reason?: string` |
| `EmployeeQueryDto` | extends `PaginationQueryDto` + `search?: string`, `status?`, `employmentType?`, `country?` |
| `EmployeeResponseDto` | All entity fields |
| `EmployeeDetailDto` | extends `EmployeeResponseDto` + `currentSalary?: SalaryRecordDto` |
| `PaginatedEmployeesDto` | `PaginatedResponseDto<EmployeeResponseDto>` |

**Service — `EmployeeService`:**

| Method | Logic |
|--------|-------|
| `findAll(query)` | TypeORM QueryBuilder; `ILIKE` on `name`/`email` for search; WHERE filters; ORDER BY safe-whitelisted; paginated |
| `findOne(id)` | Join `currentSalary`; throw `NotFoundException` if missing |
| `create(dto)` | Validate `country` in Settings; check unique `employeeId`/`email`; insert |
| `update(id, dto)` | Validate country if changed; patch fields |
| `relieve(id)` | Set `status = Left`; `currentSalaryId` stays for history |

**Pattern:** Repository pattern via TypeORM `Repository<Employee>` injected through `@InjectRepository`.

**Routes:**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/employees` | Paginated, searchable, filterable directory |
| `POST` | `/employees` | Onboard employee |
| `GET` | `/employees/:id` | Detail with current salary |
| `PATCH` | `/employees/:id` | Update fields |
| `POST` | `/employees/:id/relieve` | Set status to Left |

---

### Module 3 — `salary-templates`

**Purpose:** Manage versioned salary blueprints.

**Entity — `SalaryTemplate`:**

| Field | Type | Constraints |
|-------|------|-------------|
| id | uuid | PK |
| name | string | not null (template family name) |
| version | integer | not null, default 1 |
| country | string | not null |
| currency | string | not null |
| components | jsonb | `{ basePay, allowances?, bonus?, stock?: { quantity, vestingDate? } }` |
| isAssigned | boolean | default false |

Unique constraint: `(name, version)`.
Index: `(name)`, `(country)`, `(currency)`.

**DTOs:**

| DTO | Fields |
|-----|--------|
| `CreateTemplateDto` | `name`, `country`, `currency`, `components` |
| `CreateTemplateVersionDto` | Same shape as Create — applied as a new version of the template family |
| `TemplateResponseDto` | All fields + computed `latestVersion` |
| `TemplateListResponseDto` | `PaginatedResponseDto<TemplateResponseDto>` |

**Service — `SalaryTemplateService`:**

| Method | Logic |
|--------|-------|
| `findAll(country?, currency?)` | Filter; return all versions grouped by name |
| `findOne(id)` | Fetch by PK |
| `findLatest(name)` | Latest version for a template family |
| `create(dto)` | Insert with `version = 1` |
| `createVersion(id, dto)` | Fetch existing; insert new record with `version + 1`; same `name` |
| `markAssigned(id)` | Set `isAssigned = true`; called internally by `SalaryModule` |

**Routes:**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/salary-templates` | List all (filterable by country/currency) |
| `POST` | `/salary-templates` | Create first version |
| `GET` | `/salary-templates/:id` | Fetch one |
| `POST` | `/salary-templates/:id/versions` | New version of an existing template |

---

### Module 4 — `salary`

**Purpose:** Assign salary, revise salary, salary history, template migration.

**Entity — `SalaryRecord`:**

| Field | Type | Constraints |
|-------|------|-------------|
| id | uuid | PK |
| employeeId | uuid | FK → Employee, not null |
| templateId | uuid | FK → SalaryTemplate, nullable (null = manual, no blueprint) |
| effectiveDate | date | not null |
| baseSalary | decimal(15,2) | not null |
| currency | string | not null |
| paymentCycle | enum | `Monthly \| BiWeekly \| Weekly \| Annual` |
| components | jsonb | `{ allowances?, bonus?, stock?: { quantity, vestingDate? } }` |
| totalCompensation | decimal(15,2) | stored (not computed on read) |
| reason | string | nullable |
| createdBy | string | not null (from JWT payload) |

Index: `(employeeId)`, `(employeeId, effectiveDate DESC)`.

**Dependencies:** `EmployeeModule`, `SalaryTemplateModule`, `SettingsModule`, `CurrencyService`.

**DTOs:**

| DTO | Fields |
|-----|--------|
| `AssignSalaryDto` | `templateId?`, `effectiveDate`, `baseSalary`, `currency`, `paymentCycle`, `components`, `reason?` |
| `EditSalaryDto` | Same as Assign (all fields required — creates a new full record) + `reason` (required) |
| `MigrateTemplateDto` | `targetTemplateId`, `effectiveDate`, `reason` |
| `BulkMigrateDto` | `employeeIds: string[]`, `targetTemplateId`, `effectiveDate`, `reason` |
| `SalaryRecordDto` | All entity fields + `templateName?` |
| `SalaryHistoryDto` | `PaginatedResponseDto<SalaryRecordDto>` |

**Service — `SalaryService`:**

| Method | Logic | Pattern |
|--------|-------|---------|
| `assign(employeeId, dto, createdBy)` | 1. Guard: employee `Active`. 2. Guard: `currentSalaryId` is null — if not, throw `409 Conflict` ("Employee already has a salary. Use edit salary to revise."). 3. If `templateId`, call `TemplateService.markAssigned`. 4. Compute `totalCompensation` via `CurrencyService`. 5. Insert `SalaryRecord`. 6. Update `Employee.currentSalaryId`. All in **transaction**. | Unit of Work |
| `edit(employeeId, dto, createdBy)` | 1. Guard: employee Active. 2. Validate `effectiveDate >= latest record's effectiveDate` (chronology — correction workflow: HR re-edits with correct values + mandatory reason). 3. Compute total. 4. Insert new `SalaryRecord`. 5. Update `Employee.currentSalaryId`. **Transaction**. | Unit of Work |
| `getHistory(employeeId, query)` | Query all `SalaryRecord` for employee; paginated, ordered `effectiveDate DESC` | Repository |
| `migrateTemplate(employeeId, dto, createdBy)` | Fetch target template; pre-fill `AssignSalaryDto` from template components; call `edit()` | Delegate |
| `bulkMigrate(dto, createdBy)` | Loop `migrateTemplate` inside single **transaction**; collect errors per employee | Batch + Transaction |
| `computeTotal(record, settings)` | `baseSalary + allowances + bonus + (stock.quantity × stockPrice normalized to salary currency)` | Pure util function |

**Util — `computeTotalCompensation`:**
```
(baseSalary, components, stockPrice, stockPriceCurrency, salaryCurrency, fxRates) → decimal
```
Pure function, no side effects. Used in `SalaryService` and tested independently.

**Routes:**

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/employees/:id/salary` | Assign initial salary |
| `PATCH` | `/employees/:id/salary` | Edit salary (new revision) |
| `GET` | `/employees/:id/salary/history` | Paginated history |
| `POST` | `/employees/:id/salary/migrate` | Migrate to new template version |
| `POST` | `/salary/bulk-migrate` | Bulk template migration |

---

### Module 5 — `dashboard`

**Purpose:** Aggregated compensation analytics, normalized to base currency.

**Dependencies:** `TypeORM DataSource` (raw SQL for aggregates), `CurrencyService`, `SettingsModule`.

**DTOs:**

| DTO | Fields |
|-----|--------|
| `DashboardSummaryDto` | `totalPayroll`, `averageCompensation`, `activeEmployeeCount`, `currency` (base) |
| `CountryBreakdownDto` | `country`, `payroll`, `headcount`, `averageCompensation`, `currency` |
| `DistributionBucketDto` | `range` (e.g. `"0–25k"`), `count` |
| `TrendPointDto` | `period` (e.g. `"2025-01"`), `totalPayroll`, `currency` |
| `RecentRevisionDto` | `employeeId`, `employeeName`, `effectiveDate`, `baseSalary`, `currency`, `totalCompensation`, `reason` |
| `TrendsQueryDto` | `period: 'monthly'\|'quarterly'`, `from: date`, `to: date` |

**Service — `DashboardService`:**

| Method | SQL Strategy |
|--------|-------------|
| `getSummary()` | `JOIN employees e ON e.currentSalaryId = sr.id WHERE e.status = 'Active'`; normalize each `totalCompensation` → sum/avg |
| `getByCountry()` | Same join + `GROUP BY e.country` |
| `getDistribution()` | `CASE WHEN totalCompensation BETWEEN 0 AND 25000 THEN '0–25k' ...` → `COUNT(*) GROUP BY bucket` |
| `getTrends(query)` | `DATE_TRUNC('month'\|'quarter', sr.effectiveDate)` GROUP BY period; sum `totalCompensation` normalized |
| `getRecentRevisions(limit)` | Latest `SalaryRecord` per employee (or all recent) ordered by `createdAt DESC` |

**Pattern:** All aggregates run as raw SQL via `DataSource.query()` or QueryBuilder — never load full dataset into memory.

**Routes:**

| Method | Path | Query params | Description |
|--------|------|-------------|-------------|
| `GET` | `/dashboard/summary` | — | Summary cards |
| `GET` | `/dashboard/by-country` | — | Country table |
| `GET` | `/dashboard/distribution` | — | Histogram buckets |
| `GET` | `/dashboard/trends` | `period`, `from`, `to` | Trend line |
| `GET` | `/dashboard/recent-revisions` | `limit` (default 20) | Activity feed |

---

### Module 6 — `settings`

**Purpose:** Singleton application config — base currency, FX rates, stock config.

**Entity — `Settings`:**

| Field | Type | Notes |
|-------|------|-------|
| id | integer | always 1 (singleton) |
| baseCurrency | string | default `"USD"` |
| fxRates | jsonb | `{ "INR": 83.5, "GBP": 0.79, ... }` — rate to convert 1 unit of currency to baseCurrency |
| supportedCurrencies | jsonb | `string[]` — currencies available for salary assignment |
| supportedCountries | jsonb | `string[]` — countries available for employee assignment |
| totalStocks | integer | org stock pool |
| stockPrice | decimal | price per unit |
| stockPriceCurrency | string | |

**DTOs:**

| DTO | Fields |
|-----|--------|
| `SettingsResponseDto` | All fields |
| `UpdateSettingsDto` | All fields optional; partial update via `PATCH` |

**Service — `SettingsService`:**
- `get()` → `findOne(1)` or return seeded defaults; **cache in memory** after first load (invalidated on `update`)
- `update(dto)` → upsert id=1; invalidate cache
- `getCountries()` / `getCurrencies()` → used by `EmployeeModule`, `SalaryModule` for validation

**Pattern:** In-memory cache on singleton to avoid DB hit on every request that validates countries/currencies.

**Routes:**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/settings` | Fetch current config |
| `PATCH` | `/settings` | Partial update |

---

### Module 7 — `demo`

**Purpose:** Seed 10k demo employees and clear all data. Exposed via Settings routes.

**Dependencies:** `TypeORM DataSource` (direct inserts), `@faker-js/faker`.

**Service — `DemoService`:**

| Method | Logic |
|--------|-------|
| `getStatus()` | `SELECT COUNT(*) FROM employees` → `{ seeded: boolean, employeeCount }` |
| `seed()` | 1. Guard: only if empty. 2. Upsert Settings defaults. 3. Create ~15 salary templates across 5 countries. 4. Batch insert 10k employees (500/batch, transaction per batch). 5. Assign salary to each (SalaryRecord + update currentSalaryId). 6. Create 1–3 extra revisions for 30% of employees. Returns `{ inserted: number }`. |
| `clear()` | `TRUNCATE salary_records, employees, salary_templates RESTART IDENTITY CASCADE` — Settings row preserved. |

**Seed data shape:**
- Countries: US, UK, India, Germany, Singapore (5)
- Currencies: USD, GBP, INR, EUR, SGD (1 per country)
- Employee distribution: ~2k per country, mix of employment types and statuses (90% Active, 10% Left)
- Salary ranges realistic per country (e.g. INR 600k–2.4M, USD 60k–240k)

**Routes (nested under `/settings/demo`):**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/settings/demo/status` | Seeded status + count |
| `POST` | `/settings/demo/seed` | Seed 10k employees |
| `POST` | `/settings/demo/clear` | Clear all data (preserve settings) |

---

### Shared Utility Functions (backend)

| Function | Location | Purpose |
|----------|----------|---------|
| `computeTotalCompensation(...)` | `salary/salary.utils.ts` | Pure: baseSalary + components + stock → total |
| `normalizeAmount(amount, from, to, fxRates)` | `common/currency/currency.utils.ts` | Pure: FX conversion |
| `getPaginationMeta(total, page, limit)` | `common/pagination/pagination.utils.ts` | Builds meta |
| `safeOrderBy(field, allowed, alias)` | `common/pagination/pagination.utils.ts` | Whitelist sort columns |
| `buildBuckets(min, max, count)` | `dashboard/dashboard.utils.ts` | Compute histogram ranges |

---

## Frontend Modules

### Dependencies (`frontend/package.json`)

```json
{
  "dependencies": {
    "next": "latest",
    "react": "^19",
    "react-dom": "^19",
    "axios": "latest",
    "@reduxjs/toolkit": "latest",
    "react-redux": "latest",
    "recharts": "latest",
    "react-hook-form": "latest",
    "@hookform/resolvers": "latest",
    "zod": "latest"
  }
}
```

shadcn/ui is installed via CLI (`npx shadcn@latest init`) — components are copied into `src/components/ui/`, not a runtime dep.

---

### State Architecture

**Redux store** (`src/lib/store.ts`):

```
store
├── auth (slice)           ← token, isAuthenticated
└── baseApi (RTK Query)    ← all server data
    ├── employeesApi
    ├── salaryApi
    ├── templatesApi
    ├── dashboardApi
    ├── settingsApi
    └── demoApi
```

**`authSlice`** — persisted to `localStorage`:

| State | Type |
|-------|------|
| `token` | `string \| null` |
| `isAuthenticated` | `boolean` |

Actions: `setCredentials({ token })`, `logout()`

**RTK Query base** (`src/lib/api/baseApi.ts`):
- Uses `axiosBaseQuery` — custom `baseQuery` wrapping axios instance
- axios instance: `baseURL = NEXT_PUBLIC_API_URL`, request interceptor injects `Authorization: Bearer <token>` from Redux store

---

### Frontend Module Breakdown

#### `lib/api/axiosBaseQuery.ts`
- Creates axios instance
- Request interceptor: reads token from store → sets header
- Response interceptor: 401 → dispatch `logout()` → redirect to `/login`

#### `lib/api/employeesApi.ts` (RTK Query)

| Endpoint | Method | Path | Tags |
|----------|--------|------|------|
| `getEmployees(query)` | GET | `/employees` | `Employee` |
| `getEmployee(id)` | GET | `/employees/:id` | `Employee` |
| `createEmployee(dto)` | POST | `/employees` | invalidates `Employee` |
| `updateEmployee({id, dto})` | PATCH | `/employees/:id` | invalidates `Employee` |
| `relieveEmployee({id, dto})` | POST | `/employees/:id/relieve` | invalidates `Employee` |

#### `lib/api/salaryApi.ts`

| Endpoint | Method | Path |
|----------|--------|------|
| `assignSalary({id, dto})` | POST | `/employees/:id/salary` |
| `editSalary({id, dto})` | PATCH | `/employees/:id/salary` |
| `getSalaryHistory({id, query})` | GET | `/employees/:id/salary/history` |
| `migrateTemplate({id, dto})` | POST | `/employees/:id/salary/migrate` |
| `bulkMigrate(dto)` | POST | `/salary/bulk-migrate` |

#### `lib/api/dashboardApi.ts`

| Endpoint | Path |
|----------|------|
| `getSummary` | `/dashboard/summary` |
| `getByCountry` | `/dashboard/by-country` |
| `getDistribution` | `/dashboard/distribution` |
| `getTrends(query)` | `/dashboard/trends` |
| `getRecentRevisions` | `/dashboard/recent-revisions` |

#### `lib/types/` — TypeScript models (mirror backend response DTOs)

```
Employee.ts
SalaryRecord.ts
SalaryTemplate.ts
Settings.ts
Dashboard.ts        (DashboardSummary, CountryBreakdown, DistributionBucket, TrendPoint, RecentRevision)
Pagination.ts       (PaginationQuery, PaginatedResponse<T>)
```

---

### Pages & Presentation

#### `(public)/login`
- **Components:** `LoginPage` → `LoginForm` (react-hook-form + zod)
- **State:** calls `POST /auth/login` via axios directly (not RTK Query — pre-auth); dispatches `setCredentials`
- **Flow:** submit → success → redirect to `/dashboard`

#### `(auth)/layout.tsx` — Auth Shell
- **Components:** `GlobalHeader` (title, settings link, action slot), `Sidebar` (icon nav)
- **Guard:** checks `isAuthenticated` from Redux; redirects unauthenticated to `/login`
- **Sidebar items:** Employees, Dashboard, Settings (with icon + tooltip)

#### `(auth)/dashboard`
- **Components:**
  - `SummaryCards` — 3 metric cards (total payroll, avg compensation, headcount)
  - `CountryBreakdownTable` — shadcn Table; country, payroll, headcount
  - `SalaryDistributionChart` — Recharts BarChart from distribution buckets
  - `CompensationTrendsChart` — Recharts LineChart; period selector (monthly/quarterly) + date range
  - `RecentRevisionsList` — shadcn Table; latest 20 salary changes
- **Data:** all from `dashboardApi` RTK Query hooks; loading skeletons while fetching

#### `(auth)/employees`
- **Components:**
  - `EmployeeFilterBar` — search input (debounced 300ms), status/type/country dropdowns
  - `EmployeeTable` — shadcn Table with server-side pagination
    - Columns: name, employeeId, country, type, status, actions
  - `OnboardModal` — shadcn Dialog; `CreateEmployeeDto` form
- **Data:** `getEmployees(query)` from `employeesApi`; query params update on filter/page change
- **Pattern:** `useGetEmployeesQuery` re-fetches on `queryArgs` change; RTK Query handles loading/error state

#### `(auth)/employees/[id]`
- **Components:**
  - `EmployeeInfoCard` — name, email, country, type, status, joining date; Edit inline or modal
  - `CurrentSalaryCard` — current baseSalary, components, total, currency, effective date; links to Edit/Assign
  - `SalaryHistoryTimeline` — ordered list of all `SalaryRecord` entries; paginated
  - `RelieveModal` — confirmation + optional reason; calls `relieveEmployee`
  - `ActionBar` — Assign Salary / Edit Salary / Relieve buttons (context-aware — hidden if Left)
- **Data:** `getEmployee(id)` + `getSalaryHistory(id)`

#### `(auth)/employees/[id]/salary/create` (Assign Salary)
- **Components:** `TemplatePicker` (select template → pre-fills form), `SalaryForm`
- **SalaryForm fields:** effectiveDate, baseSalary, currency, paymentCycle, allowances, bonus, stock (qty + vestingDate), reason
- **Flow:** pick template → components auto-filled → HR edits values → submit → `assignSalary` → redirect to employee detail

#### `(auth)/employees/[id]/salary/edit` (Edit / Revision)
- **Components:** `SalaryForm` (pre-filled from `currentSalary`; reason required)
- **Flow:** pre-fill from current salary → HR changes values → submit → `editSalary` → redirect to employee detail

#### `(auth)/settings`
- **Sections:**
  - **General** — baseCurrency, supportedCurrencies, supportedCountries (tag inputs), FX rates (key-value editor)
  - **Stock** — totalStocks, stockPrice, stockPriceCurrency
  - **Demo** — "Seed 10,000 Employees" button + "Clear All Data" button; both show confirmation dialog; live status badge (seeded/empty + count)
- **Data:** `getSettings` + `updateSettings`; `getDemoStatus`, `seedDemo`, `clearDemo`

---

### Future Enhancements (Frontend)

- Template comparison and diff view
- Bulk employee selection UI for migration
- Date range picker for dashboard trends (currently period selector only)
- Exportable reports (CSV/PDF)

---

*This plan is the authoritative reference for M1 (backend) and M2 (frontend) implementation. Business rules referenced from [business-specification.md](./business-specification.md).*
