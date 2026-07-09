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
- `CurrencyService` — `normalize(amount, from, to)` using `currency_rates` table
- `ExchangeRateApiClient` — `GET https://v6.exchangerate-api.com/v6/{API_KEY}/latest/{baseCurrency}` → parse `conversion_rates`, upsert DB

**App enums** (`src/common/enums/`):
```ts
export enum PaymentCycle {
  Monthly = 'Monthly',
  BiWeekly = 'BiWeekly',
  Weekly = 'Weekly',
  Annual = 'Annual',
}
```
Validated in DTOs via `@IsEnum(PaymentCycle)`. Stored as `varchar` in DB — no PostgreSQL enum type.

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
| `FRONTEND_URL` | `http://localhost:5173` | Yes | Allowed CORS origin (Vite dev server) |
| `EXCHANGE_RATE_API_KEY` | `your-api-key` | Yes | ExchangeRate-API key for FX sync |

### Frontend — `frontend/.env`

| Variable | Example | Required | Purpose |
|----------|---------|----------|---------|
| `VITE_API_URL` | `http://localhost:3001` | Yes | Backend base URL for all API calls |

Both apps must include a `.env.example` committed to git (placeholder values only). `.env` files go in `.gitignore`.

---

## CORS Configuration

Backend `main.ts` must enable CORS before `app.listen()`:

```ts
app.enableCors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
});
```

`FRONTEND_URL` is `http://localhost:5173` in dev (Vite default) and the deployed static host URL in production. Without this, every browser request from the frontend will be blocked.

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
| `findAll(query)` | Active employees only by default; `ILIKE` search; paginated; salary in original currency |
| `findLeft(query)` | `status = Left` — for `/employees/left` |
| `findOne(id)` | Join `currentSalary`; throw `NotFoundException` if missing |
| `create(dto)` | Validate `country` in Settings; check unique `employeeId`/`email`; insert |
| `update(id, dto)` | Validate country if changed; patch fields |
| `relieve(id)` | Set `status = Left`; `currentSalaryId` stays for history |

**Pattern:** Repository pattern via TypeORM `Repository<Employee>` injected through `@InjectRepository`.

**Routes:**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/employees` | Active employees directory |
| `GET` | `/employees/left` | Left employees (excluded from dashboard) |
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

### Module 4 — `salary-drafts`

**Purpose:** Stage salary changes before commit. One draft per employee (separate table).

**Entity — `SalaryDraft`:** Same shape as `SalaryRecord` draft fields + `employeeId` unique.

**Service — `SalaryDraftService`:**

| Method | Logic |
|--------|-------|
| `upsert(employeeId, dto, createdBy)` | Create or update draft; compute stock snapshots; one per employee |
| `findAll(query)` | List all pending drafts for Drafts page |
| `findOne(id)` | Single draft detail |
| `commit(id, createdBy)` | Transaction: validate → create `SalaryRecord` with snapshots → update `currentSalaryId` → delete draft |
| `rollback(id)` | Delete draft; no change to active salary |

**Routes:**

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/employees/:id/salary/draft` | Create/update draft (assign or edit) |
| `GET` | `/salary-drafts` | List pending drafts |
| `GET` | `/salary-drafts/:id` | Draft detail |
| `POST` | `/salary-drafts/:id/commit` | Commit → SalaryRecord |
| `DELETE` | `/salary-drafts/:id` | Rollback draft |

---

### Module 5 — `salary`

**Purpose:** Committed salary history, template migration.

**Entity — `SalaryRecord`:**

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| employeeId | uuid | FK |
| templateId | uuid \| null | FK |
| effectiveDate | date | |
| baseSalary | decimal(15,2) | |
| currency | string | Employee's salary currency |
| paymentCycle | varchar | App enum validated |
| components | jsonb | |
| totalCompensation | decimal(15,2) | Stored at commit in `currency` |
| stockPriceAtEntry | decimal \| null | Snapshot |
| stockPriceCurrencyAtEntry | string \| null | Snapshot |
| stockValueInStockCurrency | decimal \| null | `qty × stockPriceAtEntry` |
| stockValueInSalaryCurrency | decimal \| null | Converted to employee currency |
| fxRateUsed | decimal \| null | Rate used for stock conversion |
| reason | string \| null | |
| createdBy | string | |

**Service — `SalaryService`:**

| Method | Logic |
|--------|-------|
| `getHistory(employeeId, query)` | Paginated committed records |
| `migrateFromTemplate(templateId, dto, createdBy)` | Bulk migrate employees; `preserveFields[]` keeps existing values, applies template for rest → creates drafts |

**Util — `computeTotalCompensation`:** Pure function; includes `stockValueInSalaryCurrency` from snapshots.

**Routes:**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/employees/:id/salary/history` | Committed history |
| `POST` | `/salary-templates/:id/migrate` | Bulk migrate with `preserveFields` → drafts |

---

### Module 6 — `currency-rates`

**Purpose:** Sync and serve FX rates from ExchangeRate-API.

**Entity — `CurrencyRate`:** `baseCurrency`, `targetCurrency`, `rate`, `syncedAt`. Unique `(baseCurrency, targetCurrency)`.

**Service — `CurrencyRateService`:**

| Method | Logic |
|--------|-------|
| `sync()` | `GET /v6/{API_KEY}/latest/{baseCurrency}` → upsert all `conversion_rates` → update `Settings.lastFxSyncAt` |
| `findAll()` | Return rates table for Settings UI |
| `getRate(from, to)` | Lookup for `CurrencyService.normalize()` |

**Routes:**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/settings/currency-rates` | Rate table |
| `POST` | `/settings/currency-rates/sync` | Trigger API sync |

---

### Module 7 — `dashboard`

**Purpose:** Analytics for **Active employees only**. Optional display-currency conversion.

**Query params (all dashboard endpoints):**
- `displayCurrency`: `original` \| `USD` \| `INR` \| ... (supported currencies)
- `from`, `to`: date range (trends)

**Service — `DashboardService`:**

| Method | Logic |
|--------|-------|
| `getSummary(query)` | Active only. If `original`: return breakdown per currency. Else: convert totals using DB rates. |
| `getByCountry(query)` | Group by country; respect `displayCurrency` |
| `getDistribution(query)` | Fixed buckets; convert if display currency set |
| `getTrends(query)` | Filter `effectiveDate` between `from` and `to`; daily/weekly granularity |
| `getRecentRevisions(limit)` | Latest **committed** SalaryRecords |

**Routes:** `GET /dashboard/summary`, `/by-country`, `/distribution`, `/trends`, `/recent-revisions`

---

### Module 8 — `settings`

**Purpose:** Singleton config — base currency, stock, supported countries/currencies. FX rates live in `currency_rates` table.

**Entity — `Settings`:**

| Field | Type | Notes |
|-------|------|-------|
| id | integer | always 1 |
| baseCurrency | string | default `"USD"` — used as base for FX sync |
| supportedCurrencies | jsonb | `string[]` |
| supportedCountries | jsonb | `string[]` |
| totalStocks | integer | org stock pool |
| stockPrice | decimal | price per unit |
| stockPriceCurrency | string | |
| lastFxSyncAt | timestamp \| null | last successful sync |

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

### Module 9 — `demo`

**Purpose:** Seed 10k demo employees and clear all data. Exposed via Settings routes.

**Dependencies:** `TypeORM DataSource` (direct inserts), `@faker-js/faker`.

**Service — `DemoService`:**

| Method | Logic |
|--------|-------|
| `getStatus()` | `SELECT COUNT(*) FROM employees` → `{ seeded: boolean, employeeCount }` |
| `seed()` | 1. Guard: only if empty. 2. Upsert Settings defaults. 3. Create ~15 salary templates across 5 countries. 4. Batch insert 10k employees (500/batch, transaction per batch). 5. Assign salary to each (SalaryRecord + update currentSalaryId). 6. Create 1–3 extra revisions for 30% of employees. Returns `{ inserted: number }`. |
| `clear()` | `TRUNCATE salary_drafts, salary_records, employees, salary_templates RESTART IDENTITY CASCADE` |

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

React **SPA** with **Vite**. Client-side routing via **React Router v6**. No SSR, no file-based routing.

### Dependencies (`frontend/package.json`)

```json
{
  "dependencies": {
    "react": "^19",
    "react-dom": "^19",
    "react-router-dom": "latest",
    "axios": "latest",
    "@reduxjs/toolkit": "latest",
    "react-redux": "latest",
    "recharts": "latest",
    "react-hook-form": "latest",
    "@hookform/resolvers": "latest",
    "zod": "latest"
  },
  "devDependencies": {
    "vite": "latest",
    "@vitejs/plugin-react": "latest",
    "typescript": "latest"
  }
}
```

shadcn/ui installed via CLI — components copied into `src/components/ui/`.

### Vite config (`vite.config.ts`)

```ts
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
```

### Routing (`src/routes/index.tsx`)

```tsx
<BrowserRouter>
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route element={<ProtectedRoute><AuthLayout /></ProtectedRoute>}>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/employees" element={<EmployeesPage />} />
      <Route path="/employees/:id" element={<EmployeeDetailPage />} />
      <Route path="/employees/:id/salary/create" element={<AssignSalaryPage />} />
      <Route path="/employees/:id/salary/edit" element={<EditSalaryPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/dashboard" />} />
  </Routes>
</BrowserRouter>
```

`ProtectedRoute` — reads `isAuthenticated` from Redux; redirects to `/login` if false.

---

### State Architecture

**Redux store** (`src/lib/store.ts`):

```
store
├── auth (slice)           ← token, isAuthenticated
└── baseApi (RTK Query)    ← all server data
    ├── employeesApi
    ├── salaryApi
    ├── salaryDraftsApi
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
- axios instance: `baseURL = import.meta.env.VITE_API_URL`, request interceptor injects `Authorization: Bearer <token>` from Redux store

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

#### `/login` — `LoginPage`
- **Components:** `LoginForm` (react-hook-form + zod)
- **State:** calls `POST /auth/login` via axios (pre-auth); dispatches `setCredentials`
- **Flow:** submit → success → `navigate('/dashboard')`

#### `AuthLayout`
- **Sidebar:** Employees, Left Employees, Dashboard, Drafts, Settings

#### `/dashboard` — `DashboardPage`
- **Components:** `SummaryCards`, `DisplayCurrencyFilter` (`original` + supported currencies), `CountryBreakdownTable`, `SalaryDistributionChart`, `CompensationTrendsChart` (`from`/`to` date pickers), `RecentRevisionsList`

#### `/employees` — `EmployeesPage`
- **Shows:** salary in **original currency** only
- **Components:** `EmployeeFilterBar`, `EmployeeTable`, `OnboardModal`, `RelieveModal`

#### `/employees/left` — `LeftEmployeesPage`
- **Notice banner:** "Left employees are excluded from dashboard payroll analytics."
- Same table pattern; read-only salary history links

#### `/drafts` — `DraftsPage`
- **Components:** `DraftsTable` — employee, proposed total, effective date, actions (Commit / Rollback / Edit)
- **Data:** `salaryDraftsApi`

#### `/employees/:id` — `EmployeeDetailPage`
- **Components:** `EmployeeInfoCard`, `CurrentSalaryCard` (stock snapshots visible), `SalaryHistoryTimeline`, `ActionBar`
- **Data:** `getEmployee(id)` + `getSalaryHistory(id)`

#### `/employees/:id/salary/create` & `/edit`
- **Flow:** save draft via `POST /employees/:id/salary/draft` → redirect to `/drafts` or employee detail

#### `/settings` — `SettingsPage`
- **Sections:** General (base currency, countries), **CurrencyRatesTable** + **Sync** button, Stock, Demo
- **Data:** `settingsApi`, `currencyRatesApi`, `demoApi`

---

### Future Enhancements (Frontend)

- Template comparison and diff view
- Bulk employee selection UI for migration
- Display currency toggle on employee detail (secondary line in chosen currency)
- Exportable reports (CSV/PDF)

---

*This plan is the authoritative reference for M1 (backend) and M2 (frontend) implementation. Business rules referenced from [business-specification.md](./business-specification.md).*
