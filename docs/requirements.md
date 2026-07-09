# ACME HR Salary Management — Requirements

## Goal

Web app for ACME's **HR Manager** to manage compensation for ~**10,000 employees** across countries — replacing spreadsheets with searchable records, salary history, and organization-wide analytics.

---

## User & Context

| | |
|---|---|
| **User** | HR Manager (single authenticated user) |
| **Organization** | Single tenant (ACME) |
| **Problem** | Excel-based salary tracking — slow, error-prone, no reliable history |

---

## UI & Navigation

### Unauthenticated
| Screen | Purpose |
|--------|---------|
| **Landing page** | Public entry point with login form |

### Authenticated layout
| Element | Purpose |
|---------|---------|
| **Global header** | Title + subtext (left); Settings link + optional action buttons (right) |
| **Sidebar** | Icon nav — Employees, Left Employees, Dashboard, Drafts, Settings |

### Pages
| Page | Purpose |
|------|---------|
| **Dashboard** | Compensation analytics — Active employees only; `displayCurrency` filter |
| **Employees** | Active employee directory — salary shown in **original currency** |
| **Left employees** | Separate route — relieved employees with notice (excluded from dashboard) |
| **Drafts** | Pending salary changes — commit or rollback before they take effect |
| **Onboard employee** | Create new employee record (modal) |
| **Relieve employee** | Mark employee as Left (modal) |
| **Create / Edit salary** | Saves to **draft** (not committed until Drafts page) |
| **Settings** | Base currency, FX rate table + Sync, stock config, **Demo** section |

---

## In Scope

### Employee Management
Fields: `employeeId`, `name`, `email`, `country`, `employmentType` (Permanent / Part-time / Contract), `status` (Active / Left), `joiningDate`.

Directory with search, filter, sort, pagination. View employee profile with salary history.

### Compensation Management
- **Salary templates (versioned)** — reusable blueprints; immutable once used. Structural changes → new version.
- **Template migration** — from template detail page; bulk select employees; **`preserveFields`** option keeps existing employee salary values, applies template base for non-preserved fields.
- **Salary draft workflow** — assign or edit salary saves to `SalaryDraft` (separate table, one per employee). HR reviews on **Drafts** page → **commit** (creates `SalaryRecord`, updates `currentSalaryId`) or **rollback** (discards draft). Multiple edits allowed before commit.
- **SalaryRecord** — committed, append-only history. `totalCompensation` stored at write in employee's currency.
- **Stock snapshots** — at commit: store `stockPriceAtEntry`, `stockPriceCurrencyAtEntry`, `stockValueInStockCurrency`, `stockValueInSalaryCurrency`, `fxRateUsed`.
- **paymentCycle** — app enum (`Monthly`, `BiWeekly`, `Weekly`, `Annual`); validated in code, stored as varchar in DB.

### Dashboard & Reporting

**Active employees only.** Left employees on separate `/employees/left` route — not included in any dashboard metric.

| # | Metric | API |
|---|--------|-----|
| 1–8 | Total payroll, average, headcount, by country, distribution, trends, recent revisions | `GET /dashboard/*` |

**Trends:** `from` and `to` date range for granular period selection.

**Currency display filter (`displayCurrency`):**
- `original` — show values in each employee's native currency; group/break down by currency (no blended cross-currency totals).
- Any supported currency (e.g. `USD`) — convert using DB-synced rates for display only.

**Employee listings** always show salary in **original employee currency** — no conversion.

### Settings

**General**
- **Base currency** — base for FX sync (ExchangeRate-API)
- **Currency rates table** — rates stored in DB; **Sync** button fetches latest from API
- **Stock** — total stocks, stock price, stock price currency

**Demo** (for assessors / live demos)
- **Seed** — populate ~10,000 employees with multi-country compensation and revision history
- **Clear all** — wipe all demo data (employees, salaries, templates); preserves Settings configuration

Both actions require confirmation before executing.

---

## Out of Scope

| Excluded | Why |
|----------|-----|
| Payroll, tax, payslips | Compensation tracking only |
| Multi-tenancy, complex RBAC | Single org, single HR user |
| Employee self-service | HR-only persona |
| Full equity lifecycle | Stock stored as basic component |
| Excel import/export, AI chat, notifications | Not core to MVP |
| Automatic template migration | HR-driven migration only in MVP; rules-based auto-migration deferred |

---

## Future Enhancements

Deliberately deferred to demonstrate scope discipline while acknowledging real-world evolution:

| Enhancement | Why deferred |
|-------------|--------------|
| **Template version management** | Richer version lifecycle UI (draft, publish, deprecate) beyond MVP create-and-assign |
| **Bulk migration to newer versions** | Enhanced bulk wizard with filters, preview, and rollback |
| **Dynamic salary component configuration** | HR-defined component types; MVP uses fixed component set per template |
| **Automatic migration with validation** | Rules-based migration (e.g. by country/role) needs safeguards and audit |
| **Template comparison and diff view** | Side-by-side version diff valuable but not required for core workflows |

---

## Key Business Rules

1. Salary changes go through **draft** first — committed `SalaryRecord` is append-only.
2. `totalCompensation` stored at write in employee's **original currency**; listings never auto-convert.
3. Dashboard: Active only; `displayCurrency` filter (`original` or supported currency).
4. Left employees on separate route — excluded from dashboard.
5. FX rates synced from ExchangeRate-API, stored in DB; manual Sync in Settings.
6. Stock price + FX rate snapshotted on each committed `SalaryRecord`.
7. Template migration supports `preserveFields` to keep existing employee values.
8. Must perform over ~10,000 seeded records (pagination, indexed queries).

---

## Non-Functional

- Full-stack: **NestJS** (`backend/`) + **React + Vite** (`frontend/`) — single repo, separate `package.json` per app; deployed independently
- **Node v24** via **nvm** (`.nvmrc` at repo root); **Yarn** for dependencies in both apps
- Unit tests on core domain logic; Swagger API docs with Bearer auth; incremental git commits
- Artifacts: architecture, trade-offs, AI approach

---

*Domain entities and module structure: [architecture.md](./architecture.md)*
