# Development Plan

Milestone-based delivery. Incremental git commits track progress within each milestone.

---

## Milestones

### M0 — Foundation
**Goal:** Repo, docs, and app scaffolding ready.

- Requirements, architecture, and business rules documented in `docs/`
- `.nvmrc` (Node 24) at repo root
- `backend/` — NestJS + Yarn, health-check endpoint, Swagger `/api/docs`
- `frontend/` — Next.js + Yarn, `NEXT_PUBLIC_API_URL` env config

**Done when:** Both apps start locally with `yarn`.

---

### M1 — Backend Core
**Goal:** Full REST API with domain logic and database.

- TypeORM entities and migrations (Employee, Template, Assignment, Revision, Settings)
- Auth module (JWT login + Bearer guard)
- Swagger/OpenAPI setup (`@nestjs/swagger`, Bearer auth, `/api/docs`)
- Employees module (CRUD, onboard, relieve)
- Salary module (versioned templates, assignments, revisions, individual + bulk migration)
- Settings module (base currency, FX rates, stock config)
- Dashboard module (aggregates with currency normalization)
- Demo module (seed + clear all under settings)

**Done when:** All API endpoints functional against Postgres; core unit tests pass.

---

### M2 — Frontend
**Goal:** Complete HR Manager UI wired to backend.

- Landing page + login
- Auth shell (global header, sidebar, routing)
- Employee directory, onboard, relieve
- Create/edit salary flows
- Dashboard (summary cards, charts)
- Settings (general config + Demo section with seed/clear confirmation)

**Done when:** HR can complete all core workflows through the UI.

---

### M3 — Ship
**Goal:** Production-ready submission.

- Unit tests for salary revision, template immutability, currency normalization
- Deployment config (backend + frontend + Postgres)
- README with setup and deploy instructions
- Artifacts finalized (trade-offs, AI approach, demo link)
- Video demo recorded

**Done when:** Public URLs live; 10k seed works; assessor can run end-to-end.

---

## Trade-offs

| Decision | Chosen | Why |
|----------|--------|-----|
| Backend framework | NestJS | DI, modular structure, less boilerplate decisions |
| ORM | TypeORM + migrations | NestJS native integration; explicit schema evolution |
| Module layout | Feature + common | Clear boundaries; shared auth/currency/pagination |
| Currency | Manual FX rates in Settings | Normalizes dashboard without external FX API dependency |
| Stock | Org-level price + currency; optional per-employee component | No toggle — avoids inconsistent state when toggled off mid-use |
| Template versioning | Immutable once assigned; new version on structural change | Preserves assignment integrity; mirrors real HR payroll evolution |
| Template migration | Manual individual + bulk by HR in MVP | Automatic migration deferred — needs validation, diff, and audit |
| Auth | Single-user JWT | Matches persona; not assessment focus |

---

## Definition of Done

- [ ] M0–M3 milestones complete
- [ ] Landing login → authenticated app shell
- [ ] Full employee + salary workflows
- [ ] Dashboard with base-currency metrics
- [ ] 10k seed; unit tests pass
- [ ] Deployed + video demo
- [ ] Incremental commit history reflecting milestone progress
