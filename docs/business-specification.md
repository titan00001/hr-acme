# Business Rules Reference

Supplement to [requirements.md](./requirements.md). Covers rules not repeated in the main spec.

---

## Employee Lifecycle

| Action | Rule |
|--------|------|
| **Onboard** | Creates Active employee; no salary until explicitly assigned |
| **Relieve** | Sets status to Left; record and salary history preserved |
| **Update** | Any field editable except immutable salary revisions |

Duplicate `employeeId` or `email` should be rejected.

---

## Compensation Rules

| Rule | Detail |
|------|--------|
| Versioned templates | Each template has a `version`. Once assigned to any employee, that version is **immutable** |
| New version on change | Compensation structure changes create a new template version — existing assignments are untouched |
| Manual migration (MVP) | From template detail page; bulk select; `preserveFields` keeps existing employee values |
| Draft-first workflow | Assign/edit saves to `SalaryDraft`; commit creates `SalaryRecord`; one draft per employee |
| SalaryRecord append-only | Committed records never edited or deleted |
| Chronology | New `SalaryRecord.effectiveDate` must be ≥ latest existing record's effectiveDate |
| Active record | `Employee.currentSalaryId` updated only on **draft commit** |

**Total compensation** = `baseSalary` + allowances + bonus + `stockValueInSalaryCurrency` (stored at commit in employee's currency).

**Stock snapshots (on commit):** `stockPriceAtEntry`, `stockPriceCurrencyAtEntry`, `stockValueInStockCurrency`, `stockValueInSalaryCurrency`, `fxRateUsed` — HR can see what stock was worth at time of entry.

---

## Salary Template Management

HR manages salary templates from a dedicated **Templates** area (list, detail, create, edit, delete, new version). Templates are blueprints used to pre-fill salary drafts — they are not employee salary assignments themselves.

### Lifecycle actions

| Action | Allowed when | Rule |
|--------|--------------|------|
| **Create** | Always | Creates template family at `version = 1` with `isAssigned = false`. `name` + `version` must be unique. Country must be in Settings supported countries; currency in supported currencies. |
| **Update** | `isAssigned = false` | HR may edit `name` (only if no other versions share the family — prefer stable family names), `country`, `currency`, and `components` on an unused version. Once `isAssigned = true`, update is **rejected** — HR must create a **new version** instead. |
| **Create version** | Always | From an existing template id: inserts a new row with same family `name`, `version = max(version) + 1`, new components/country/currency as provided. Prior versions are unchanged. |
| **Delete** | `isAssigned = false` | Deletes that template **version** only. If the version was used by any `SalaryRecord` or pending `SalaryDraft`, delete is **rejected** (`isAssigned` must already be true in that case). Assigned versions are never deleted in MVP. |

### Immutability after use

| Event | Effect |
|-------|--------|
| Draft saved with `templateId` | Does **not** mark template assigned (draft can still change) |
| Draft **committed** with `templateId` | Sets that template version `isAssigned = true` |
| HR tries PATCH/DELETE on assigned version | API returns `409 Conflict` (or `400`) with message to create a new version |

### UI expectations

- Templates list: search/filter by country/currency; show name, latest version, assigned status
- Template detail: view all versions; actions Create version / Edit (if unused) / Delete (if unused)
- Assign/Edit salary forms continue to use Template picker (read-only selection) from these templates

---

## Salary Draft Workflow

| Step | Action |
|------|--------|
| 1 | HR assigns or edits salary → saved to `SalaryDraft` (upsert; one per employee) |
| 2 | Draft appears on **Drafts** page — not yet active |
| 3 | HR can edit draft multiple times before committing |
| 4 | **Commit** → validates → creates `SalaryRecord` with snapshots → updates `currentSalaryId` → deletes draft |
| 5 | **Rollback** → deletes draft; employee salary unchanged |

Initial assign also goes through draft (no direct commit from form).

---

## Salary Correction (Wrong Value Entered)

Because `SalaryRecord` is append-only and history is immutable, HR **cannot delete or edit** a past record. Corrections are handled by creating a new revision that supersedes the incorrect one.

### Workflow

| Step | Action |
|------|--------|
| 1 | HR notices an incorrect salary value (wrong baseSalary, wrong component, wrong date) |
| 2 | HR opens **Edit Salary** → creates/updates **draft** with correct values |
| 3 | HR enters the correct values with the appropriate `effectiveDate` |
| 4 | `reason` field is **required** — HR records why the change was made (e.g. "Correction: previous entry had incorrect base salary") |
| 5 | HR **commits** draft on Drafts page → new `SalaryRecord` becomes active |
| 6 | The incorrect record remains in history — visible with its `reason` and `createdAt` for audit purposes |

### Rules

| Scenario | Rule |
|----------|------|
| Wrong salary amount | Create new revision with correct amount; reason required |
| Wrong component value | Create new revision with corrected components; reason required |
| Wrong effective date (too far in future) | Create a new revision with a corrected date — only allowed if corrected date ≥ the wrong date (chronology constraint). If HR needs an earlier date, this requires a future enhancement (admin override). |
| Wrong effective date (already superseded by a later revision) | Cannot backdate past an existing later revision in MVP — document as known limitation |
| Accidental salary assignment to wrong employee | Relieve the employee if appropriate; correct salary on correct employee. No record deletion. |

### Known Limitation (MVP)
The chronology constraint (`effectiveDate ≥ latest record`) prevents HR from backdating a correction before an already-created later revision. This edge case is noted for a future **admin correction** capability with an override mechanism and mandatory audit note.

---

## Currency & FX Rates

- Employee listings and detail → always **original currency** (`SalaryRecord.currency`).
- Dashboard → `displayCurrency` filter: `original` (per-currency breakdown) or convert to selected currency using DB rates.
- FX rates synced from **ExchangeRate-API** (`GET /v6/{API_KEY}/latest/{baseCurrency}`) → stored in `currency_rates` table.
- Settings shows rate table with **Sync** button; `EXCHANGE_RATE_API_KEY` in backend env.
- Conversion is for **display only** on dashboard — source records unchanged.

### Dashboard Aggregation Strategy (Performance)

Dashboard analytics are pre-aggregated at **write time** into snapshot tables denominated in the **base currency** (e.g. USD). This avoids per-employee FX loops on every dashboard load and keeps read latency O(1) regardless of employee count.

| Snapshot | Granularity | Updated when |
|----------|------------|--------------|
| `dashboard_country_snapshots` | per `(country, currency)` | salary committed, employee relieved/reinstated |
| `dashboard_trend_snapshots` | per `(effectiveDate, currency)` | salary committed |
| `dashboard_distribution_snapshots` | per fixed bucket | salary committed, employee relieved/reinstated |

**At query time**, totals in base currency are multiplied by a single FX rate to produce the chosen `displayCurrency`. No per-row conversion occurs at read time.

**FX sync** does not invalidate snapshots — snapshots stay in base currency. Only the single rate applied at query time changes.

### Distribution Buckets (Fixed)

Salary distribution uses **fixed, pre-defined bucket boundaries** (e.g. 0–50k, 50k–100k, 100k–200k, 200k–500k, 500k+) denominated in base currency. Bucket counts are stored in `dashboard_distribution_snapshots` and updated incrementally on salary events. This allows pre-aggregation; dynamic bucket boundaries (derived from min/max at query time) are not used.

---

## Left Employees

- **Not included** in dashboard metrics or Active employee directory.
- Separate route `/employees/left` with notice explaining exclusion from payroll analytics.
- Full salary history retained; no new drafts after relieve.

---

## Reporting

See [requirements.md — Dashboard & Reporting](./requirements.md#dashboard--reporting).

- Dashboard: **Active employees only**.
- Left employees: separate page only.
- Country breakdowns use employee's current `country`.
- Trends: `from` / `to` date range.

---

## Stock

**Settings (org-level):** `totalStocks` (pool size, updatable on backend), `stockPrice`, `stockPriceCurrency`. No enable/disable toggle — stock is always available as an optional employee component.

**Per employee:** `quantity`, `vestingDate` in components JSON.

**On commit — snapshots stored on `SalaryRecord`:**
- `stockPriceAtEntry` / `stockPriceCurrencyAtEntry` — org stock price at commit time
- `stockValueInStockCurrency` — `quantity × stockPriceAtEntry`
- `stockValueInSalaryCurrency` — converted to employee currency using DB FX rate
- `fxRateUsed` — rate applied for stock conversion

HR sees both native stock value and converted value on employee detail and history.

---

## Demo (Settings)

| Action | Rule |
|--------|------|
| **Seed** | Inserts ~10k employees with templates, assignments, and revisions; idempotent only if DB is empty or after clear |
| **Clear all** | Deletes all employees, salary templates, assignments, and revisions; **Settings (base currency, FX rates, stock config) are preserved** |
| **Confirmation** | Both actions require explicit user confirmation in the UI |

---

## Acceptance Checklist

- [ ] Login → authenticated shell with header + sidebar
- [ ] Employee directory with search/filter/sort over 10k records
- [ ] Onboard, relieve, view profile with salary history
- [ ] **Salary templates:** create, update unused, delete unused, create new version; reject edit/delete when assigned
- [ ] Draft workflow: edit → Drafts page → commit or rollback
- [ ] Left employees on separate route; excluded from dashboard
- [ ] Dashboard with `displayCurrency` filter and date-range trends
- [ ] Settings: FX table + Sync, stock config, Demo (seed / clear all)
