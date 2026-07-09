# Milestone Gate Protocol

Both agents **must** follow this protocol. No agent advances to the next milestone without user approval.

---

## Rules

1. **One milestone at a time** — implement only the current milestone scope.
2. **Tests with the milestone** — unit/integration/component tests ship in the same milestone, not later.
3. **Stop at completion** — post a Milestone Completion Report and **wait**.
4. **No scope creep** — if you discover extra work, note it under "Deferred" and do not implement.
5. **User tests manually** — provide exact steps in the report.
6. **Suggest commit message** — every report includes a ready-to-use commit message (see each agent runbook § Commit messages). Agents commit only when the user explicitly asks.

---

## Milestone Completion Report (template)

Copy this into the chat when a milestone is done:

```markdown
## Milestone Completion Report

**Milestone:** M2.3 — Employees module
**Agent:** Backend
**Branch / commits:** <commit hash if already committed, else "not committed">

### Suggested commit
```
feat(employees): M2.3 add employee CRUD and left list
```
Files to stage: `<paths>`

### Delivered
- [ ] List of files/endpoints created
- [ ] Tests added: `<test file paths>`
- [ ] `yarn test` result: PASS / FAIL

### How to test (manual)
1. `nvm use && cd backend && yarn install && yarn start:dev`
2. Open Swagger: http://localhost:3001/api/docs
3. Login → Authorize → `GET /employees`
4. ...

### Given/When/Then covered
- Employee onboard scenario
- Duplicate employee reject
- ...

### Known issues / deferred
- None

---
**Awaiting approval.** Reply `APPROVED: M2.3` to proceed to M2.4, or `FIX: M2.3 — <issue>`.
```

---

## User responses

| Response | Agent action |
|----------|--------------|
| `APPROVED: M2.3` | Start next milestone in sequence |
| `FIX: M2.3 — pagination broken on page 2` | Fix only that milestone; re-post report |
| `SKIP: M2.3` | Do not use unless user explicitly wants to defer |
| `STATUS` | Print current milestone, what's done, what's blocked |

---

## Backend ↔ Frontend handoff

When backend completes a milestone that frontend depends on:

1. Backend posts report with **Swagger path** and **example curl** for new endpoints.
2. User approves backend milestone.
3. Frontend agent may start the matching UI milestone.
4. Frontend report must confirm integration against running backend (or mocked tests if backend not up).

### Dependency map

| Backend milestone | Unblocks frontend |
|-------------------|-------------------|
| M1.2 Auth | M3.2 Login |
| M2.1 Settings | M3.10 Settings (partial) |
| M2.2 Currency | M3.10 FX sync |
| M2.3 Employees | M3.4, M3.5, M3.6 |
| M2.4 Templates | M3.7 TemplatePicker |
| M2.5 Drafts | M3.7, M3.8 |
| M2.6 History | M3.5 history timeline |
| M2.7 Dashboard | M3.9 Dashboard |
| M2.8 Demo | M3.10 Demo section |

---

## Definition of milestone done

A milestone is done only when **all** are true:

- [ ] Code matches `docs/technical-plan.md` for that module
- [ ] Tests for that milestone pass (`yarn test`)
- [ ] No linter errors introduced
- [ ] Completion report posted (includes suggested commit message)
- [ ] User replied `APPROVED: <id>`
