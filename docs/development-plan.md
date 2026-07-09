# Development Plan

Milestone-based delivery. Incremental git commits track progress within each milestone.

---

## Milestones

### M0 — Foundation
**Goal:** Repo, docs, and app scaffolding ready.

- Requirements, architecture, and business rules documented in `docs/`
- `.nvmrc` (Node 24) at repo root
- `backend/` — NestJS + Yarn, health-check endpoint, Swagger `/api/docs`
- `frontend/` — React + Vite + Yarn, `VITE_API_URL` env config

**Done when:** Both apps start locally with `yarn`.

---

### M1 — Backend Core
**Goal:** Full REST API with domain logic and database.

- TypeORM entities: Employee, SalaryTemplate, SalaryRecord, SalaryDraft, CurrencyRate, Settings
- Auth, Swagger, Employees (incl. `GET /employees/left`)
- Salary drafts module (create, list, commit, rollback)
- Salary module (history, template migration with `preserveFields`)
- Currency rates module (ExchangeRate-API sync → DB)
- Settings module (base currency, stock, FX table)
- Dashboard (Active only; `displayCurrency`, `from`/`to` trends)

**Done when:** All API endpoints functional against Postgres; core unit tests pass.

---

### M2 — Frontend
**Goal:** Complete HR Manager UI wired to backend.

- Landing page + login
- Auth shell (global header, sidebar, routing)
- Employee directory (original currency), Left employees page, Drafts page
- Assign/edit salary → draft flow
- Dashboard with display-currency filter + date range trends
- Settings: FX rate table + Sync button

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

- [ ] M0–M3 milestones complete
- [ ] Landing login → authenticated app shell
- [ ] Full employee + salary workflows
- [ ] Dashboard with display-currency filter
- [ ] Draft workflow + Left employees route
- [ ] 10k seed; unit tests pass
- [ ] Deployed + video demo
- [ ] Incremental commit history reflecting milestone progress
