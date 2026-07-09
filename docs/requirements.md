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
| **Sidebar** | Icon nav — Employees, Dashboard, Settings |

### Pages
| Page | Purpose |
|------|---------|
| **Dashboard** | Compensation analytics (metrics normalized to base currency) |
| **Employees** | Directory — search, filter, sort, pagination |
| **Onboard employee** | Create new employee record |
| **Relieve employee** | Mark employee as Left (retain history) |
| **Create salary** | Assign salary via template |
| **Edit salary** | New salary revision (append-only) |
| **Settings** | Base currency, FX rates, stock config, **Demo** section (seed / clear all) |

---

## In Scope

### Employee Management
Fields: `employeeId`, `name`, `email`, `country`, `employmentType` (Permanent / Part-time / Contract), `status` (Active / Left), `joiningDate`.

Directory with search, filter, sort, pagination. View employee profile with salary history.

### Compensation Management
- **Salary templates (versioned)** — reusable blueprints per country/currency with recommended component values. Immutable once used as basis for any employee salary. Structural changes → new template version.
- **Template migration (MVP)** — HR migrates employees to a newer template version individually (from template detail) or in bulk. **Automatic migration is out of scope.**
- **Salary assign** — HR picks a template (pre-fills values, editable), saves as `SalaryRecord`. Sets employee's active salary.
- **Salary edit (revision)** — HR edits current salary; saves as a new `SalaryRecord` (append-only, never overwrites). History = all records ordered by effective date.
- **Stock component** — stored inside salary components JSON: `{ quantity, vestingDate? }`. Valued at org-level `stockPrice`.
- One active salary per employee at any time (`Employee.currentSalaryId` → latest record)

### Dashboard & Reporting

All metrics normalized to **base currency** (Settings). **Active employees only** for compensation aggregates; employees without salary excluded from payroll totals but included in headcount.

| # | Metric | Description | API |
|---|--------|-------------|-----|
| 1 | **Total payroll** | Sum of total compensation across active employees | `GET /dashboard/summary` |
| 2 | **Average compensation** | Mean total compensation across active employees | `GET /dashboard/summary` |
| 3 | **Active employee count** | Total active headcount | `GET /dashboard/summary` |
| 4 | **Payroll by country** | Total payroll grouped by employee country | `GET /dashboard/by-country` |
| 5 | **Headcount by country** | Active employee count grouped by country | `GET /dashboard/by-country` |
| 6 | **Salary distribution** | Compensation spread across ranges (histogram/buckets) | `GET /dashboard/distribution` |
| 7 | **Compensation trends** | Payroll totals over time (from revision history) | `GET /dashboard/trends` |
| 8 | **Recent revisions** | Latest salary changes org-wide, newest first | `GET /dashboard/recent-revisions` |

**UI layout:** Summary cards (metrics 1–3) at top → country breakdown table/chart (4–5) → distribution chart (6) → trends chart (7) → recent revisions list (8).

**Currency normalization:** Values converted via Settings FX rates. Original employee currency preserved on source records.

### Settings

**General**
- **Base currency** — organization reporting currency
- **FX rates** — manual rates to normalize multi-currency payroll
- **Stock** — total stocks (org pool), stock price, and stock price currency

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

1. Salary templates are **versioned and immutable** once used — structural changes create a new version.
2. HR migrates employees to newer template versions **individually or in bulk**; no automatic migration in MVP.
3. Every salary change creates a new **SalaryRecord** (append-only) — history is never overwritten.
4. `Employee.currentSalaryId` always references the latest active salary record.
5. **Left** employees retained with full history; excluded from payroll aggregates.
6. Dashboard totals normalized to base currency via configured FX rates.
7. Must perform over ~10,000 seeded records (pagination, indexed queries).

---

## Non-Functional

- Full-stack: **NestJS** (`backend/`) + **React + Vite** (`frontend/`) — single repo, separate `package.json` per app; deployed independently
- **Node v24** via **nvm** (`.nvmrc` at repo root); **Yarn** for dependencies in both apps
- Unit tests on core domain logic; Swagger API docs with Bearer auth; incremental git commits
- Artifacts: architecture, trade-offs, AI approach

---

*Domain entities and module structure: [architecture.md](./architecture.md)*
