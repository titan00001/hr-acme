# Development Plan

Milestone-based delivery. Incremental git commits track progress within each milestone.

---

## Milestone Map

Delivery is **module-by-module** — one focused milestone per step. Tests ship with each milestone, not at the end.

```
Phase 0 — Scaffold          M0.1 → M0.3
Phase 1 — Backend common    M1.1 → M1.3
Phase 2 — Backend modules   M2.1 → M2.8
Phase 3 — Frontend modules  M3.1 → M3.11
Phase 4 — Ship              M4.1 → M4.3
```

---

## Phase 0 — Scaffold

### M0.1 — Docs & repo setup
**Goal:** Repository and documentation baseline.

- `docs/` complete (requirements, architecture, technical plan, business rules)
- `.nvmrc`, `.gitignore`, root `README.md` skeleton
- **Test:** none yet

**Done when:** Docs committed; repo initialized.

---

### M0.2 — Backend scaffold
**Goal:** NestJS app boots with tooling.

- `backend/` — NestJS + Yarn + TypeScript
- `common/database` — TypeORM config, `BaseEntity`
- Health check `GET /health`
- Jest configured; smoke test passes
- `.env.example`

**Done when:** `yarn start:dev` and `yarn test` pass in `backend/`.

---

### M0.3 — Frontend scaffold
**Goal:** React + Vite app boots with tooling.

- `frontend/` — Vite + React + TypeScript + Yarn
- Vitest + React Testing Library configured; smoke test passes
- `VITE_API_URL` in `.env.example`

**Done when:** `yarn dev` and `yarn test` pass in `frontend/`.

---

## Phase 1 — Backend common

### M1.1 — Shared common layer
**Goal:** Reusable infrastructure all modules depend on.

- `common/pagination` — DTOs, `safeOrderBy`, `paginationMeta`
- `common/enums` — `PaymentCycle`, `EmploymentType`, `EmployeeStatus`
- `common/currency` — `CurrencyService.normalize()` (stub; rates from DB later)
- **Unit tests:** pagination utils, enum validation

**Done when:** Common utils tested; importable by feature modules.

---

### M1.2 — Auth module
**Goal:** JWT login and global guard.

- `auth` module — `AuthService`, `JwtStrategy`, `JwtAuthGuard`, `@Public()`
- `POST /auth/login`
- **Integration tests:** valid login, invalid login, protected route 401

**Done when:** Auth scenarios pass (see Test Plan — Auth).

---

### M1.3 — Swagger & API docs
**Goal:** OpenAPI spec with Bearer auth.

- `common/swagger` — `DocumentBuilder`, Bearer scheme
- `/api/docs` UI, `/api/docs-json` spec
- All existing routes documented

**Done when:** Swagger UI loads; Authorize flow works with JWT.

---

## Phase 2 — Backend modules

### M2.1 — Settings module
**Goal:** Singleton app configuration.

- `Settings` entity + migration + seed defaults
- `GET /settings`, `PATCH /settings`
- In-memory cache on read
- **Integration tests:** get defaults, partial update

**Done when:** Settings API functional.

---

### M2.2 — Currency rates module
**Goal:** FX rates synced from ExchangeRate-API → DB.

- `CurrencyRate` entity + migration
- `ExchangeRateApiClient` — `GET /v6/{key}/latest/{baseCurrency}`
- `GET /settings/currency-rates`, `POST /settings/currency-rates/sync`
- Wire `CurrencyService` to read from `currency_rates` table
- **Unit tests:** rate lookup, normalize conversion
- **Integration tests:** sync (mocked API), upsert rates

**Done when:** FX sync scenarios pass (see Test Plan — Currency & FX).

---

### M2.3 — Employees module
**Goal:** Employee lifecycle and directory.

- `Employee` entity + migration + indexes
- CRUD, onboard, relieve, `GET /employees/left`
- Search, filter, sort, pagination
- Validate country against Settings
- **Integration tests:** create, duplicate reject, relieve, left list, pagination

**Done when:** Employee scenarios pass (see Test Plan — Employee Management).

---

### M2.4 — Salary templates module
**Goal:** Full HR management of versioned salary blueprints (create, update, delete, version).

- `SalaryTemplate` entity + migration
- `GET /salary-templates` — list (filter country/currency, paginate)
- `POST /salary-templates` — create v1
- `GET /salary-templates/:id` — detail
- `PATCH /salary-templates/:id` — update **only if** `isAssigned = false`
- `DELETE /salary-templates/:id` — delete **only if** `isAssigned = false`
- `POST /salary-templates/:id/versions` — create next version (always allowed)
- Validate country/currency against Settings
- `isAssigned` immutability guard on update/delete
- **Unit tests:** immutability guard, version increment, delete rejected when assigned
- **Integration tests:** create v1, update unused, reject update when assigned, create v2, delete unused, reject delete when assigned, list filters

**Done when:** Template management scenarios pass (see Test Plan — Salary Templates).

---

### M2.5 — Salary drafts module
**Goal:** Stage salary changes before commit.

- `SalaryDraft` entity + migration (unique `employeeId`)
- `computeTotalCompensation` util + stock snapshot logic
- `POST /employees/:id/salary/draft`, `GET /salary-drafts`, `GET /salary-drafts/:id`
- `POST /salary-drafts/:id/commit`, `DELETE /salary-drafts/:id` (rollback)
- **Unit tests:** total compensation calc, stock snapshots, one-draft-per-employee
- **Integration tests:** upsert draft, commit creates record, rollback deletes draft

**Done when:** Draft scenarios pass (see Test Plan — Salary Drafts, Stock Snapshots).

---

### M2.6 — Salary history & template migration
**Goal:** Committed history and bulk migration.

- `SalaryRecord` entity + migration (with snapshot fields)
- `GET /employees/:id/salary/history`
- `POST /salary-templates/:id/migrate` — `preserveFields[]` → creates drafts
- **Integration tests:** append-only history, migration with preserveFields

**Done when:** History & correction scenarios pass (see Test Plan — Salary History).

---

### M2.7 — Dashboard module
**Goal:** Analytics for Active employees only.

- `GET /dashboard/summary`, `/by-country`, `/distribution`, `/trends`, `/recent-revisions`
- `displayCurrency` filter (`original` \| supported currency)
- Trends `from` / `to` date range
- Exclude Left employees and uncommitted drafts
- **Integration tests:** original vs converted currency, date range, left excluded

**Done when:** Dashboard scenarios pass (see Test Plan — Dashboard & Reporting).

---

### M2.8 — Demo / seed module
**Goal:** 10k employee seed and clear.

- `DemoService` — batch seed, truncate clear
- `GET /settings/demo/status`, `POST /settings/demo/seed`, `POST /settings/demo/clear`
- **Integration tests:** seed idempotent guard, clear preserves settings

**Done when:** Demo scenarios pass (see Test Plan — Settings & Demo); seed runs locally.

---

## Phase 3 — Frontend modules

### Design system — Harbor Ink (brief)

All M3.x UI must follow the **Harbor Ink** theme (cool mist surfaces, deep teal brand, warm gold accent):

| Token area | Source of truth |
|------------|-----------------|
| Colors, fonts, radius, shadows | `frontend/src/presentation/styles/theme.css` |
| Motion (fade / slide / scale) | `frontend/src/presentation/styles/animations.css` |
| Typed JS/TS refs | `frontend/src/presentation/styles/tokens.ts` |

**Fonts:** Fraunces (display) · Sora (UI) · IBM Plex Mono. **Do not** invent ad-hoc colors or system font stacks — use Tailwind theme utilities (`bg-brand`, `text-ink`, `shadow-md`, `font-display`, …) or `theme` from `tokens.ts`. Full rules: `agents/frontend-agent.md` § Design system.

**API errors:** Surface failures with `ErrorHandler` / `extractApiError` (`presentation/components/feedback/`, `infrastructure/api/extract-api-error.ts`) — do not inline HTTP status parsing in pages. See `agents/frontend-agent.md` § Surfacing API errors.

### Wisdom — API contract for parallel frontend / backend

**For true parallel development, a frozen API contract is mandatory** before either side builds consumers or producers in isolation. Without an agreed contract (OpenAPI / typed DTOs / example payloads), frontend and backend diverge on paths, query params, error shapes, and field names — and integration becomes rework.

| Approach | When to use | Contract source |
|----------|-------------|-----------------|
| **Parallel (ideal next time)** | Backend and frontend start together | Agree OpenAPI (or `docs/technical-plan.md` route tables + sample JSON) **first**; both implement against that contract; mock the other side in tests |
| **Backend-first (this project)** | Backend M1–M2 already done and functional | Treat the **running backend** as the contract: Swagger UI `/api/docs`, machine-readable `/api/docs-json`, plus `docs/technical-plan.md` for intent |

**Current project rule:** Phase 2 backend is complete. Frontend milestones **must** wire to the live NestJS API — do not invent alternate paths or response shapes. Before coding a page:

1. Confirm the dependent backend module(s) below are implemented.
2. Inspect the endpoint in Swagger (`http://localhost:3001/api/docs`) or `/api/docs-json`.
3. Mirror request/response types in `frontend/src/domain/types/` from that contract.
4. Point `VITE_API_URL` at the running backend for manual verification.

**Next-project takeaway:** if frontend and backend must move in parallel again, **specify the contract first** (OpenAPI + example payloads), then implement both sides against it. Backend-first only works when the API is already stable — which is the case here.

### Frontend ↔ backend dependency map

| Frontend | Needs backend module(s) | Required APIs (minimum for the page to work) |
|----------|-------------------------|-----------------------------------------------|
| M3.1 App foundation | M1.2 Auth (401 behavior) | Any protected route returning `401` without Bearer (e.g. `GET /employees`) |
| M3.2 Login | M1.2 Auth | `POST /auth/login`; optional `GET /auth/me` |
| M3.3 Auth shell | M1.2 Auth (session only) | No new APIs — uses stored JWT from M3.2 |
| M3.4 Employees directory | M2.3 Employees | `GET /employees` |
| M3.5 Employee detail & modals | M2.3 Employees, M2.6 Salary history | `GET/POST/PATCH /employees`, `POST /employees/:id/relieve`, `GET /employees/:id/salary/history` |
| M3.6 Left employees | M2.3 Employees | `GET /employees/left` |
| M3.7 Salary forms (draft) | M2.4 Templates, M2.5 Drafts, M2.1 Settings (stock/countries) | `GET /salary-templates`, `GET /salary-templates/:id`, `POST /employees/:id/salary/draft`, `GET /settings` |
| M3.8 Drafts page | M2.5 Drafts | `GET /salary-drafts`, `GET /salary-drafts/:id`, `POST /salary-drafts/:id/commit`, `DELETE /salary-drafts/:id` |
| M3.9 Dashboard | M2.7 Dashboard | `GET /dashboard/summary`, `/by-country`, `/distribution`, `/trends`, `/recent-revisions` |
| M3.10 Settings | M2.1 Settings, M2.2 Currency rates, M2.8 Demo | `GET/PATCH /settings`, `GET /settings/currency-rates`, `POST /settings/currency-rates/sync`, `GET/POST /settings/demo/*` |
| M3.11 Salary templates page | M2.4 Templates | `GET/POST/PATCH/DELETE /salary-templates`, `GET /salary-templates/:id`, `POST /salary-templates/:id/versions` |

---

### M3.1 — App foundation
**Goal:** Router, Redux store, API client.

| | |
|--|--|
| **Backend deps** | M1.2 Auth (global JWT guard — unauthenticated calls return `401`) |
| **Required APIs** | Contract smoke only: any protected route (e.g. `GET /employees`) must `401` without token so the interceptor can logout |

- React Router routes skeleton
- `authSlice` + `localStorage` persistence
- `axiosBaseQuery` + Bearer interceptor + 401 → logout
- `ProtectedRoute` guard
- **Component test:** ProtectedRoute redirects when unauthenticated

**Done when:** Route guard works; store configured; 401 interceptor verified against running backend.

---

### M3.2 — Login page
**Goal:** Authenticate HR Manager.

| | |
|--|--|
| **Backend deps** | M1.2 `modules/auth` |
| **Required APIs** | `POST /auth/login` (body: username/password → JWT); optional `GET /auth/me` |

- `LoginPage` + `LoginForm` (react-hook-form + zod)
- Call `POST /auth/login`; dispatch `setCredentials`; navigate to dashboard
- **Component tests:** valid submit, validation errors

**Done when:** Auth UI works against live `POST /auth/login`.

---

### M3.3 — Auth shell layout
**Goal:** Header, sidebar, outlet for protected routes.

| | |
|--|--|
| **Backend deps** | M1.2 Auth (JWT already stored from M3.2) |
| **Required APIs** | None new — shell is presentation-only |

- `AuthLayout` — `GlobalHeader`, `Sidebar` (Employees, Left, Dashboard, Drafts, Templates, Settings)
- **Component test:** sidebar renders nav items

**Done when:** Authenticated shell visible after login.

---

### M3.4 — Employees directory
**Goal:** Active employee list with search and pagination.

| | |
|--|--|
| **Backend deps** | M2.3 `modules/employees` |
| **Required APIs** | `GET /employees` (query: search, filters, sort, page, limit → paginated Active employees; salary in original currency) |

- `employeesApi` RTK Query endpoints
- `EmployeesPage` — filter bar, table, salary in original currency
- **Component tests:** table renders rows, search debounce

**Done when:** Directory loads paginated employees from live `GET /employees`.

---

### M3.5 — Employee detail & modals
**Goal:** Profile, onboard, relieve.

| | |
|--|--|
| **Backend deps** | M2.3 `modules/employees`; M2.6 `modules/salary` (history) |
| **Required APIs** | `GET /employees/:id`, `POST /employees` (onboard), `PATCH /employees/:id`, `POST /employees/:id/relieve`, `GET /employees/:id/salary/history` |

- `EmployeeDetailPage` — info card, current salary, history timeline
- `OnboardModal`, `RelieveModal`
- **Component tests:** onboard form validation, relieve confirmation

**Done when:** Onboard and relieve workflows work end-to-end via UI against live APIs.

---

### M3.6 — Left employees page
**Goal:** Separate view for relieved employees.

| | |
|--|--|
| **Backend deps** | M2.3 `modules/employees` |
| **Required APIs** | `GET /employees/left` (paginated Left employees) |

- `LeftEmployeesPage` — notice banner, read-only table
- `GET /employees/left` wired
- **Component test:** notice banner renders

**Done when:** Left employees visible from live API; excluded from Active directory.

---

### M3.7 — Salary forms (draft)
**Goal:** Assign and edit salary → save as draft.

| | |
|--|--|
| **Backend deps** | M2.4 `modules/salary-templates`; M2.5 `modules/salary-drafts`; M2.1 `modules/settings` (stock price / countries for form context) |
| **Required APIs** | `GET /salary-templates`, `GET /salary-templates/:id`, `POST /employees/:id/salary/draft`, `GET /settings` |

- `AssignSalaryPage`, `EditSalaryPage` — `TemplatePicker`, `SalaryForm`
- `salaryDraftsApi` — `POST /employees/:id/salary/draft`
- **Component tests:** template pre-fill, form validation, paymentCycle enum

**Done when:** Saving salary creates/updates draft via live API; no direct commit from form.

---

### M3.8 — Drafts page
**Goal:** Review, commit, rollback pending changes.

| | |
|--|--|
| **Backend deps** | M2.5 `modules/salary-drafts` |
| **Required APIs** | `GET /salary-drafts`, `GET /salary-drafts/:id`, `POST /salary-drafts/:id/commit`, `DELETE /salary-drafts/:id` |

- `DraftsPage` — table with Commit / Rollback / Edit actions
- Wire commit and rollback endpoints
- **Component tests:** commit button calls API, rollback confirms

**Done when:** Full draft → commit → active salary flow works via UI against live APIs.

---

### M3.9 — Dashboard page
**Goal:** Metrics with currency filter and date range.

| | |
|--|--|
| **Backend deps** | M2.7 `modules/dashboard` (uses FX rates from M2.2 when `displayCurrency` ≠ `original`) |
| **Required APIs** | `GET /dashboard/summary`, `GET /dashboard/by-country`, `GET /dashboard/distribution`, `GET /dashboard/trends` (query: `displayCurrency`; trends `from`/`to`); `GET /dashboard/recent-revisions` (query: `page`, `limit`; sort `createdAt DESC`) |

- `dashboardApi` RTK Query endpoints
- `DashboardPage` — summary cards, country table, distribution chart, trends chart (`from`/`to`), recent revisions (**10 per page**, `createdAt DESC`, paginated)
- `DisplayCurrencyFilter` component
- **Component tests:** currency filter changes query params, date pickers

**Done when:** Dashboard reflects live API data with filters; recent revisions show newest commits first (10 per page) with pagination.

---

### M3.10 — Settings page
**Goal:** Config, FX sync, stock, demo.

| | |
|--|--|
| **Backend deps** | M2.1 `modules/settings`; M2.2 `modules/currency-rates`; M2.8 `modules/demo` |
| **Required APIs** | `GET /settings`, `PATCH /settings`, `GET /settings/currency-rates`, `POST /settings/currency-rates/sync`, `GET /settings/demo/status`, `POST /settings/demo/seed`, `POST /settings/demo/clear` |

- `settingsApi`, `currencyRatesApi`, `demoApi`
- `SettingsPage` — base currency, countries, stock, `CurrencyRatesTable` + Sync, Demo seed/clear
- **Component tests:** sync button triggers API, demo confirmation dialog

**Done when:** Settings fully functional against live backend; FX sync works.

---

### M3.11 — Salary templates management page
**Goal:** HR can create, edit, delete, and version salary templates.

| | |
|--|--|
| **Backend deps** | M2.4 `modules/salary-templates` |
| **Required APIs** | `GET /salary-templates`, `POST /salary-templates`, `GET /salary-templates/:id`, `PATCH /salary-templates/:id`, `DELETE /salary-templates/:id`, `POST /salary-templates/:id/versions` |

- Sidebar link **Templates** → `TemplatesPage` (list) + `TemplateDetailPage` / create-edit dialogs
- `templatesApi` — full CRUD + create version
- Disable Edit/Delete in UI when `isAssigned = true`; show **Create version** instead
- **Component tests:** create form validation, edit disabled when assigned, delete confirmation, new version flow
- **Integration / manual:** create → update → assign via draft commit → edit rejected → create version → delete unused version

**Done when:** HR can fully manage templates against live API per business rules.

---

## Phase 4 — Ship

### M4.1 — E2E smoke tests
**Goal:** Critical paths verified end-to-end.

- Playwright in `frontend/e2e/smoke/` (see `frontend/e2e/README.md`)
- Login → onboard → assign draft → commit → dashboard
- Login → Templates → create template → update → delete unused
- Login → relieve → verify left page
- Settings → seed → directory shows demo count
- **Maps to:** full Test Plan smoke coverage

**Done when:** `yarn test:e2e:smoke` green locally (backend running).

---

### M4.2 — Deploy & README
**Goal:** Public URLs and setup docs.

- Deploy backend (Railway/Render) + Postgres
- Deploy frontend (Netlify/static host)
- README: install, env vars, `yarn test`, deploy steps

**Done when:** Assessor can clone, run, and open deployed URLs.

---

### M4.3 — Final artifacts & demo
**Goal:** Submission-ready package.

- Trade-offs, AI approach docs finalized
- Video demo recorded (walkthrough of core flows)
- Incremental commit history reviewed

**Done when:** Repo link + demo URL + video shared.

---

## Testing Strategy

Testing runs **alongside each milestone** — not deferred to the end.

| Layer | Tool | When | Scope |
|-------|------|------|-------|
| **Unit** | Jest (backend), Vitest (frontend) | Each backend/frontend milestone | Utils, services, validators per module |
| **Integration** | Jest + Supertest + test Postgres | M2.x backend milestones | HTTP + DB per module |
| **Component** | Vitest + React Testing Library | M3.x frontend milestones | Page/component per milestone |
| **E2E smoke** | Playwright | M4.1 | Critical user paths |

**Principles:** fast, deterministic, no external API calls in CI (mock ExchangeRate-API); seed minimal fixtures per test file.

---

## Test Plan (Given / When / Then)

### Auth

**Scenario: HR logs in with valid credentials**
- **Given** the HR Manager is on the login page and valid credentials are configured in env
- **When** they submit the correct username and password
- **Then** they receive a JWT, are redirected to the dashboard, and subsequent API calls include `Authorization: Bearer <token>`

**Scenario: HR is rejected with invalid credentials**
- **Given** the HR Manager is on the login page
- **When** they submit an incorrect password
- **Then** the API returns `401 Unauthorized` and no token is stored

**Scenario: Unauthenticated access is blocked**
- **Given** no valid JWT is present
- **When** a request is made to `GET /employees`
- **Then** the API returns `401 Unauthorized`

---

### Employee Management

**Scenario: HR onboards a new employee**
- **Given** the HR Manager is authenticated and `India` is a supported country
- **When** they create an employee with valid `employeeId`, `name`, `email`, `country`, `employmentType`, and `joiningDate`
- **Then** the employee appears in the Active directory with status `Active` and no salary assigned

**Scenario: Duplicate employee is rejected**
- **Given** an employee with `employeeId` `E001` already exists
- **When** HR attempts to create another employee with the same `employeeId`
- **Then** the API returns `409 Conflict`

**Scenario: HR relieves an employee**
- **Given** an Active employee exists with committed salary history
- **When** HR marks them as `Left` via relieve
- **Then** the employee status is `Left`, salary history is preserved, and they appear on `/employees/left` but not in the Active directory

**Scenario: Employee directory shows original currency**
- **Given** an Active employee has a committed salary in `INR`
- **When** HR views the employee directory
- **Then** `totalCompensation` is displayed in `INR` with no automatic conversion

**Scenario: Employee search and pagination**
- **Given** 10,000 seeded employees exist
- **When** HR searches by name and requests page 2 with limit 20
- **Then** results return within acceptable time, matching employees only, with correct pagination metadata

---

### Salary Drafts

**Scenario: HR creates a salary draft on assign**
- **Given** an Active employee has no committed salary
- **When** HR fills the salary form and saves
- **Then** a `SalaryDraft` is created, `Employee.currentSalaryId` is unchanged, and the draft appears on the Drafts page

**Scenario: Only one draft per employee**
- **Given** employee `E001` already has a pending draft
- **When** HR saves another salary change for the same employee
- **Then** the existing draft is updated (upserted), not duplicated

**Scenario: HR commits a draft**
- **Given** a valid `SalaryDraft` exists for an Active employee
- **When** HR clicks Commit on the Drafts page
- **Then** a new `SalaryRecord` is created, stock snapshots are stored, `currentSalaryId` is updated, and the draft is deleted

**Scenario: HR rollbacks a draft**
- **Given** a pending `SalaryDraft` exists
- **When** HR clicks Rollback
- **Then** the draft is deleted and the employee's committed salary is unchanged

**Scenario: Draft does not appear in dashboard**
- **Given** a salary change exists only as a draft (not committed)
- **When** HR views the dashboard
- **Then** the uncommitted values are excluded from all payroll metrics

---

### Salary History & Correction

**Scenario: Committed salary history is append-only**
- **Given** an employee has two committed `SalaryRecord` entries
- **When** HR views salary history
- **Then** both records are visible ordered by `effectiveDate` and neither can be edited or deleted

**Scenario: HR corrects a wrong salary via new draft**
- **Given** an employee has a committed salary with an incorrect `baseSalary`
- **When** HR creates a draft with corrected values and a reason, then commits
- **Then** a new `SalaryRecord` becomes active, the incorrect record remains in history, and the reason is stored

---

### Stock Snapshots

**Scenario: Stock values are snapshotted on commit**
- **Given** Settings has `stockPrice = 150` and `stockPriceCurrency = USD`, and the employee salary currency is `INR`
- **When** HR commits a draft with `stock.quantity = 100`
- **Then** the `SalaryRecord` stores `stockPriceAtEntry`, `stockValueInStockCurrency`, `stockValueInSalaryCurrency`, and `fxRateUsed`

**Scenario: HR views stock snapshot on employee detail**
- **Given** a committed record has stock snapshots
- **When** HR opens the employee detail page
- **Then** both the stock price at entry and the converted value in salary currency are visible

---

### Salary Templates

**Scenario: HR creates a salary template**
- **Given** HR is authenticated and `India` / `INR` are supported in Settings
- **When** they create a template with name, country, currency, and components
- **Then** a `SalaryTemplate` v1 exists with `isAssigned = false` and appears in the templates list

**Scenario: HR updates an unused template**
- **Given** a template version exists with `isAssigned = false`
- **When** HR updates components (e.g. higher `basePay`) via `PATCH /salary-templates/:id`
- **Then** the same version is updated and list/detail reflect the new values

**Scenario: HR deletes an unused template**
- **Given** a template version exists with `isAssigned = false` and no committed usage
- **When** HR deletes that template via `DELETE /salary-templates/:id`
- **Then** the version is removed and no longer appears in the list

**Scenario: HR creates a template and assigns via draft**
- **Given** a template exists for India
- **When** HR uses it to pre-fill a salary draft and later commits
- **Then** the form was pre-filled with template values, and after commit that template version has `isAssigned = true`

**Scenario: Template becomes immutable after use**
- **Given** a template version has been used as the basis for a committed `SalaryRecord`
- **When** HR attempts to `PATCH` or `DELETE` that template version
- **Then** the API rejects the change (`409`/`400`) and HR must create a new version instead

**Scenario: HR creates a new template version**
- **Given** template family `India Standard` has v1 (possibly assigned)
- **When** HR calls `POST /salary-templates/:id/versions` with updated components
- **Then** v2 is created with the same family name, `isAssigned = false`, and v1 remains unchanged

**Scenario: Template migration with preserveFields**
- **Given** employees are on template v1 and template v2 exists with a higher `basePay`
- **When** HR migrates selected employees with `preserveFields: ['baseSalary']`
- **Then** drafts are created where `baseSalary` retains the employee's current value and other fields come from v2

---

### Currency & FX Rates

**Scenario: HR syncs FX rates from API**
- **Given** `EXCHANGE_RATE_API_KEY` is configured and Settings `baseCurrency` is `USD`
- **When** HR clicks Sync on the currency rates table
- **Then** rates are fetched from ExchangeRate-API, stored in `currency_rates`, and `lastFxSyncAt` is updated

**Scenario: Dashboard with original currency filter**
- **Given** active employees are paid in both `USD` and `INR`
- **When** HR sets `displayCurrency=original` on the dashboard
- **Then** payroll totals are broken down per currency with no blended cross-currency sum

**Scenario: Dashboard with converted currency filter**
- **Given** FX rates exist in DB and employees are paid in `INR` and `USD`
- **When** HR sets `displayCurrency=USD`
- **Then** all dashboard compensation metrics are converted to USD using stored rates for display only

---

### Dashboard & Reporting

**Scenario: Left employees excluded from dashboard**
- **Given** both Active and Left employees have committed salaries
- **When** HR views any dashboard metric
- **Then** only Active employees are included in payroll and headcount totals

**Scenario: Trends filtered by date range**
- **Given** salary records exist across multiple months
- **When** HR sets trends `from=2025-01-01` and `to=2025-06-30`
- **Then** the trends chart shows only data within that range

**Scenario: Recent revisions shows committed changes only**
- **Given** one employee has a pending draft and another has a recent commit
- **When** HR views recent revisions on the dashboard
- **Then** only the committed `SalaryRecord` appears, not the draft

---

### Settings & Demo

**Scenario: HR updates stock price**
- **Given** HR is on the Settings page
- **When** they update `stockPrice` and `stockPriceCurrency`
- **Then** new drafts use the updated price at save time; existing committed records retain their snapshots

**Scenario: HR seeds demo data**
- **Given** the database has no employees
- **When** HR clicks Seed in the Demo section and confirms
- **Then** ~10,000 employees are created with salaries and the status shows seeded count

**Scenario: HR clears demo data**
- **Given** seeded employees exist
- **When** HR clicks Clear All and confirms
- **Then** employees, drafts, salary records, and templates are removed and Settings are preserved

---

### Performance

**Scenario: Directory performs over 10k employees**
- **Given** 10,000 seeded employees exist
- **When** HR loads the employee directory with default pagination
- **Then** the first page returns in under 500ms (local dev target)

---

## Trade-offs

### Architecture & Backend

| Decision | Chosen | Alternative | Why |
|----------|--------|-------------|-----|
| Backend framework | NestJS | Express (plain) | DI, opinionated structure, less low-level decisions |
| ORM | TypeORM + migrations | Prisma | NestJS native integration; explicit schema evolution via migration files |
| Module layout | Feature modules + `common/` | Flat MVC | Clear boundaries; shared concerns (auth, currency, pagination) in one place |
| Auth credentials | `.env` only, no DB users table | Seeded user row | Single HR persona; adding a table would imply future RBAC which is out of scope |
| Auth guard | Global `JwtAuthGuard` + `@Public()` opt-out | Per-route guard | Secure by default — no route is accidentally left unprotected |
| Salary model | `SalaryRecord` | Assignment + Revision as separate entities | Two entities with overlapping purpose confused the HR workflow; one record per salary event is simpler and auditable |
| `currentSalaryId` on Employee | Denormalized FK to latest record | `MAX(effectiveDate)` query on every read | O(1) lookup vs O(log n) window function at 10k scale; updated atomically in transaction |
| `totalCompensation` storage | Stored at write in employee currency | Computed on read | Listings show original currency; snapshots make history auditable |
| Salary changes | Draft table → commit | Direct write to SalaryRecord | HR can review/batch before reflecting; one draft per employee |
| FX rates | ExchangeRate-API sync → DB | Manual entry only | Live rates; Sync button in Settings |
| paymentCycle | App TypeScript enum, varchar in DB | PostgreSQL enum | Enum for validation; DB only reads/writes strings |
| Dashboard currency | `displayCurrency` filter (original or chosen) | Always normalize to base | Honest per-currency view; optional conversion for comparison |
| Left employees | Separate route, excluded from dashboard | Mixed in directory with filter | Clear separation; notice on Left page |
| Stock valuation | Snapshots on SalaryRecord at commit | Live Settings price only | HR sees stock price and converted value at time of entry |
| Settings cache | In-memory singleton cache | Query DB on every request | FX rates and country list are read far more than written; avoids DB roundtrip on every salary validation |
| Dashboard aggregates | Raw SQL `GROUP BY` / `DATE_TRUNC` | Load rows into service and aggregate in JS | Never loads 10k rows into memory; scales with data |

### Frontend

| Decision | Chosen | Alternative | Why |
|----------|--------|-------------|-----|
| Frontend framework | React + Vite (SPA) | Next.js | Internal HR tool needs no SSR; Vite is faster to scaffold and simpler for a client-side app |
| Design system | Harbor Ink (CSS tokens + Tailwind `@theme`) | Per-page one-off styles / default Inter purple | One palette for consistent HR UI; tokens live in `presentation/styles/` |
| State management | RTK Query for server data + `authSlice` for auth | Full Redux slices per domain | RTK Query handles caching, loading, invalidation automatically — less boilerplate |
| HTTP client | axios wrapped in RTK Query `baseQuery` | fetch / RTK Query default `fetchBaseQuery` | axios gives interceptors (401 → logout, token injection) without extra wiring |

| Modals vs pages | Onboard + Relieve as dialogs | Separate routes (`/employees/onboard`) | Fewer routes; context stays on the directory; HR completes action without losing list state |
| Forms | `react-hook-form` + `zod` | Controlled state + manual validation | Schema-driven validation; form state isolated from Redux |
| Charts | `recharts` | Chart.js / Victory | Composable React components; good TypeScript support; small bundle |
| Salary form | Template picker → pre-fill → editable | Blank form or locked to template values | HR always has context of the template but can adjust — matches real-world HR workflow |

### Deliberate Scope Cuts

| Cut | Reason |
|-----|--------|
| Historical FX on past records | FX snapshot on stock only at commit; full per-record FX snapshot deferred |
| No optimistic UI updates | RTK Query refetch-on-invalidate sufficient for MVP |
| Pagination: offset-based | Sufficient for 10k with server pagination |
| Admin backdate override | Chronology constraint remains; draft workflow covers most corrections |

---

## Definition of Done

- [ ] All milestones M0.1 → M4.3 complete
- [ ] `yarn test` passes in `backend/` after each M2.x milestone
- [ ] `yarn test` passes in `frontend/` after each M3.x milestone
- [ ] Given/When/Then scenarios covered by automated tests
- [ ] Full draft → commit → dashboard workflow works
- [ ] Template CRUD + new version + immutability when assigned works
- [ ] 10k seed works
- [ ] Deployed + video demo
- [ ] Incremental commit history (one or more commits per milestone)
