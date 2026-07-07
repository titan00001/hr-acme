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
| Template as blueprint | Pick a SalaryTemplate to pre-fill salary form; HR adjusts values before saving |
| SalaryRecord append-only | Every assign or edit creates a new `SalaryRecord` — never overwrite |
| Chronology | New `SalaryRecord.effectiveDate` must be ≥ latest existing record's effectiveDate |
| Active record | `Employee.currentSalaryId` always points to the latest `SalaryRecord` |
| Left employees | No new salary records after status set to Left |

**Total compensation** = `baseSalary` + sum(component values) + stock value (`quantity × stockPrice`, in `stockPriceCurrency`).

---

## Salary Correction (Wrong Value Entered)

Because `SalaryRecord` is append-only and history is immutable, HR **cannot delete or edit** a past record. Corrections are handled by creating a new revision that supersedes the incorrect one.

### Workflow

| Step | Action |
|------|--------|
| 1 | HR notices an incorrect salary value (wrong baseSalary, wrong component, wrong date) |
| 2 | HR opens **Edit Salary** for the employee |
| 3 | HR enters the correct values with the appropriate `effectiveDate` |
| 4 | `reason` field is **required** — HR records why the change was made (e.g. "Correction: previous entry had incorrect base salary") |
| 5 | New `SalaryRecord` is created and becomes the active salary (`Employee.currentSalaryId` updated) |
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
