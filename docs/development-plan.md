# Development Plan

Milestone-based delivery. Incremental git commits track progress within each milestone.

---

## Milestone Map

Delivery is **module-by-module** — one focused milestone per step. Tests ship with each milestone, not at the end.

```
Phase 0 — Scaffold          M0.1 → M0.3
Phase 1 — Backend common    M1.1 → M1.3
Phase 2 — Backend modules   M2.1 → M2.8
Phase 3 — Frontend modules  M3.1 → M3.10
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
**Goal:** Versioned salary blueprints.

- `SalaryTemplate` entity + migration
- `GET/POST /salary-templates`, `GET /salary-templates/:id`, `POST /salary-templates/:id/versions`
- `isAssigned` immutability guard
- **Integration tests:** create v1, create v2, reject edit on assigned template

**Done when:** Template scenarios pass (see Test Plan — Salary Templates).

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

### M3.1 — App foundation
**Goal:** Router, Redux store, API client.

- React Router routes skeleton
- `authSlice` + `localStorage` persistence
- `axiosBaseQuery` + Bearer interceptor + 401 → logout
- `ProtectedRoute` guard
- **Component test:** ProtectedRoute redirects when unauthenticated

**Done when:** Route guard works; store configured.

---

### M3.2 — Login page
**Goal:** Authenticate HR Manager.

- `LoginPage` + `LoginForm` (react-hook-form + zod)
- Call `POST /auth/login`; dispatch `setCredentials`; navigate to dashboard
- **Component tests:** valid submit, validation errors

**Done when:** Auth UI scenario passable manually.

---

### M3.3 — Auth shell layout
**Goal:** Header, sidebar, outlet for protected routes.

- `AuthLayout` — `GlobalHeader`, `Sidebar` (Employees, Left, Dashboard, Drafts, Settings)
- **Component test:** sidebar renders nav items

**Done when:** Authenticated shell visible after login.

---

### M3.4 — Employees directory
**Goal:** Active employee list with search and pagination.

- `employeesApi` RTK Query endpoints
- `EmployeesPage` — filter bar, table, salary in original currency
- **Component tests:** table renders rows, search debounce

**Done when:** Directory loads paginated employees from API.

---

### M3.5 — Employee detail & modals
**Goal:** Profile, onboard, relieve.

- `EmployeeDetailPage` — info card, current salary, history timeline
- `OnboardModal`, `RelieveModal`
- **Component tests:** onboard form validation, relieve confirmation

**Done when:** Onboard and relieve workflows work end-to-end via UI.

---

### M3.6 — Left employees page
**Goal:** Separate view for relieved employees.

- `LeftEmployeesPage` — notice banner, read-only table
- `GET /employees/left` wired
- **Component test:** notice banner renders

**Done when:** Left employees visible; excluded from Active directory.

---

### M3.7 — Salary forms (draft)
**Goal:** Assign and edit salary → save as draft.

- `AssignSalaryPage`, `EditSalaryPage` — `TemplatePicker`, `SalaryForm`
- `salaryDraftsApi` — `POST /employees/:id/salary/draft`
- **Component tests:** template pre-fill, form validation, paymentCycle enum

**Done when:** Saving salary creates/updates draft; no direct commit from form.

---

### M3.8 — Drafts page
**Goal:** Review, commit, rollback pending changes.

- `DraftsPage` — table with Commit / Rollback / Edit actions
- Wire commit and rollback endpoints
- **Component tests:** commit button calls API, rollback confirms

**Done when:** Full draft → commit → active salary flow works via UI.

---

### M3.9 — Dashboard page
**Goal:** Metrics with currency filter and date range.

- `dashboardApi` RTK Query endpoints
- `DashboardPage` — summary cards, country table, distribution chart, trends chart (`from`/`to`), recent revisions
- `DisplayCurrencyFilter` component
- **Component tests:** currency filter changes query params, date pickers

**Done when:** Dashboard reflects API data with filters.

---

### M3.10 — Settings page
**Goal:** Config, FX sync, stock, demo.

- `settingsApi`, `currencyRatesApi`, `demoApi`
- `SettingsPage` — base currency, countries, stock, `CurrencyRatesTable` + Sync, Demo seed/clear
- **Component tests:** sync button triggers API, demo confirmation dialog

**Done when:** Settings fully functional; FX sync works against backend.

---

## Phase 4 — Ship

### M4.1 — E2E smoke tests
**Goal:** Critical paths verified end-to-end.

- Playwright (or Cypress): login → onboard → assign draft → commit → dashboard
- Login → relieve → verify left page
- Settings → seed → directory shows 10k
- **Maps to:** full Test Plan smoke coverage

**Done when:** E2E suite green locally.

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

**Scenario: HR creates a template and assigns via draft**
- **Given** no template exists for India
- **When** HR creates a `SalaryTemplate` v1 for India/INR and uses it to pre-fill a salary draft
- **Then** the form is pre-filled with template component values and HR can edit before saving the draft

**Scenario: Template becomes immutable after use**
- **Given** a template version has been used as the basis for a committed `SalaryRecord`
- **When** HR attempts to modify that template version
- **Then** the API rejects the change and HR must create a new version instead

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
- [ ] 10k seed works
- [ ] Deployed + video demo
- [ ] Incremental commit history (one or more commits per milestone)
