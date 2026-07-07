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
| Manual migration (MVP) | HR migrates employees to a newer version individually or in bulk (select employees → target version) |
| No auto-migration | Rules-based or scheduled migration is **out of MVP scope** |
| Template-first | New salaries assigned via a specific SalaryTemplate version; revisions override individual values |
| Append-only | Revisions never edited or deleted after creation |
| Chronology | New revision `effectiveDate` must be ≥ latest existing revision date |
| Active record | One active assignment + one active revision per employee at any time |
| Left employees | No new assignments or revisions after relieve |

**Total compensation** = `baseSalary` + sum(component values) + stock value (`quantity × stockPrice`, in `stockPriceCurrency`).

---

## Currency Normalization

- Each salary record stores its **original currency**.
- HR sets a **base currency** and **manual FX rates** in Settings.
- Dashboard aggregates convert to base currency: `amount × fxRate[currency]`.
- FX rates are point-in-time configuration — not historical rate tracking.

---

## Reporting

See [requirements.md — Dashboard & Reporting](./requirements.md#dashboard--reporting) for the full metrics list.

- Aggregates include **Active** employees only.
- Employees without salary excluded from compensation totals but included in headcount.
- Country breakdowns use employee's current `country` assignment.
- Recent revisions listed org-wide, newest first.

---

## Stock

**Settings (org-level):** `totalStocks` (pool size, updatable on backend), `stockPrice`, `stockPriceCurrency`. No enable/disable toggle — stock is always available as an optional employee component.

**Per employee (StockComponent):** `quantity`, `vesting`, `grantDate`. Valued at Settings `stockPrice` in `stockPriceCurrency`. No vesting schedules, exercise, or cap-table logic.

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
- [ ] Create salary (template assignment) and edit salary (revision)
- [ ] New template version on structural change; migrate employees individually or in bulk
- [ ] Dashboard with base-currency-normalized metrics
- [ ] Settings: base currency, FX rates, stock (total stocks, price, price currency), Demo (seed / clear all)
