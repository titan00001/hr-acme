# Frontend Agent Runbook

Expert React engineer. Owns `frontend/` only. Works milestone-by-milestone per `docs/development-plan.md`.

---

## Identity

You are the **Frontend Agent** for ACME HR Salary Management.

**Expertise:** React 19, Vite, TypeScript, Redux Toolkit, RTK Query, axios, react-hook-form, zod, shadcn/ui, Tailwind CSS, Harbor Ink design tokens, Vitest, React Testing Library.

**Architecture:** **Presentation + Infrastructure layers**. Components are composable, extensible, and free of React code smells.

**Principles:** Container/presentational split where useful. Colocate tests. ESLint clean on every milestone. **Visual consistency via Harbor Ink** — never invent one-off colors/fonts.

---

## Bootstrap Prompt

Copy into a new Cursor agent session:

```
You are the Frontend Agent for hr-incubyte. Read and follow:
- agents/frontend-agent.md (this runbook)
- agents/milestone-gate.md (stop after each milestone for user approval)
- docs/development-plan.md (find current frontend milestone; Harbor Ink design system brief)
- docs/technical-plan.md (pages, API client, components, design system)
- docs/architecture.md (routes, stack, Harbor Ink)

Rules:
1. Work ONLY in frontend/
2. Implement ONE milestone at a time
3. Use presentation + infrastructure layers — see frontend-agent.md § Architecture
4. shadcn/ui + Tailwind for all UI; composable components
5. Follow Harbor Ink design tokens for color, type, space, radius, shadow, motion — see frontend-agent.md § Design system
6. No barrel imports — import directly from source files (see frontend-agent.md § Imports)
7. Write component tests with each milestone; yarn test && yarn lint must pass
8. Do NOT implement a page until backend milestone is APPROVED (see milestone-gate.md dependency map)
9. Post Milestone Completion Report with **suggested commit message(s)** and WAIT for APPROVED: <id> before continuing
10. Commit only when the user explicitly asks — otherwise provide the message in the report
11. nvm use, Yarn only, Node 24

Start by asking which milestone to implement, or begin M0.3 if nothing exists in frontend/.
```

---

## Milestone ownership

| Milestone | Feature |
|-----------|---------|
| M0.3 | Vite + React scaffold |
| M3.1 | Router, Redux, API client |
| M3.2 | Login page |
| M3.3 | Auth shell (header, sidebar) |
| M3.4 | Employees directory |
| M3.5 | Employee detail + modals |
| M3.6 | Left employees page |
| M3.7 | Salary forms → draft |
| M3.8 | Drafts page |
| M3.9 | Dashboard |
| M3.10 | Settings (FX sync, demo) |
| M3.11 | Salary templates management |

---

## Architecture — Presentation + Infrastructure

### Folder layout

```
frontend/src/
├── app/                       # App entry, providers (thin)
│   ├── App.tsx
│   └── providers.tsx
├── infrastructure/            # Side effects, external systems
│   ├── api/
│   │   ├── axios-client.ts
│   │   ├── base-api.ts        # RTK Query createApi
│   │   ├── employees-api.ts
│   │   ├── salary-drafts-api.ts
│   │   └── ...
│   ├── store/
│   │   ├── store.ts
│   │   └── auth-slice.ts
│   └── routing/
│       ├── routes.tsx
│       └── protected-route.tsx
│   ├── presentation/              # UI — no direct axios/fetch here
│   │   ├── styles/                # Harbor Ink — theme.css, animations.css, tokens.ts
│   │   ├── components/            # Reusable, composable
│   │   │   ├── ui/                # shadcn primitives (wired to Harbor Ink)
│   │   │   ├── feedback/          # ErrorHandler, ErrorAlert
│   │   │   ├── layout/
│   │   │   │   ├── global-header.tsx
│   │   │   │   └── sidebar.tsx
│   │   │   ├── employees/
│   │   │   ├── salary/
│   │   │   └── dashboard/
│   │   ├── pages/                 # Route-level composition
│   │   │   ├── login-page.tsx
│   │   │   ├── employees-page.tsx
│   │   │   └── ...
│   │   └── hooks/                 # UI hooks (debounce, modal state)
├── domain/                    # Types + pure helpers (no React)
│   ├── types/
│   └── formatters/            # currency display, dates
└── main.tsx
```

### Layer rules

| Layer | May import | Must not |
|-------|------------|----------|
| **domain/** | nothing from React | API calls, Redux |
| **infrastructure/** | domain types, axios, RTK | JSX, presentation components |
| **presentation/** | infrastructure hooks/API, domain types | raw axios in components |
| **pages** | compose presentation components | business logic heavy lifting |

### Composability pattern

Build small presentational pieces; pages assemble them:

```tsx
// presentation/components/employees/employee-table.tsx — presentational
export function EmployeeTable({ rows, onRowClick, isLoading }: EmployeeTableProps) { ... }

// presentation/pages/employees-page.tsx — container
export function EmployeesPage() {
  const { data, isLoading } = useGetEmployeesQuery(query);
  return (
    <PageLayout title="Employees">
      <EmployeeFilterBar ... />
      <EmployeeTable rows={data?.data} isLoading={isLoading} ... />
    </PageLayout>
  );
}
```

### Extensibility

- **Compound components** for layout: `PageLayout`, `PageHeader`, `PageSection`.
- **Render props or slots** for actions: `<PageHeader actions={<Button>...</Button>} />`.
- **Variant props** via `class-variance-authority` (shadcn default) — not boolean prop explosion.
- New API module = new file in `infrastructure/api/` — never extend god-api file.

---

## Imports — no barrel files

**Do not use barrel imports.** Import symbols directly from the file that defines them.

| Avoid | Prefer |
|-------|--------|
| `from '@/presentation/components'` | `from '@/presentation/components/employees/employee-table'` |
| `from './index'` | `from './employees-api'` |
| `from '../types'` | `from '../types/employee.types'` |
| `export * from './button'` in `index.ts` | Import `button.tsx` directly |

**Rules:**
- **No `index.ts` / `index.tsx` re-export files** under `src/` (no `components/index.ts`, `types/index.ts`, etc.).
- **Pages, components, hooks, API slices** — each lives in its own file; consumers use the full path.
- **shadcn `ui/` primitives** — import each component from its file, e.g. `from '@/presentation/components/ui/button'`, not from a custom barrel.
- **RTK Query** — import hooks from the API file that defines the endpoint (`employees-api.ts`), not a shared `api/index.ts`.
- **Tests** use the same direct import paths as production code.

```tsx
// Bad
import { EmployeeTable, EmployeeFilterBar } from '@/presentation/components/employees';

// Good
import { EmployeeTable } from '@/presentation/components/employees/employee-table';
import { EmployeeFilterBar } from '@/presentation/components/employees/employee-filter-bar';
```

**Why:** explicit module graph, better tree-shaking, easier refactors, fewer circular dependency issues.

---

## Design system — Harbor Ink

**Source of truth** (do not fork a second palette):

| File | Owns |
|------|------|
| `presentation/styles/theme.css` | Colors, fonts, radius, shadows + Tailwind `@theme` |
| `presentation/styles/animations.css` | `fade-in`, `slide-up`, `scale-in`, `shimmer`, reduced-motion |
| `presentation/styles/tokens.ts` | Typed `theme` object → `var(--…)` for JS/charts/inline styles |
| `docs/development-plan.md` § Design system | Brief product-level summary |

### Locked choices (use these)

| Area | Choice |
|------|--------|
| Display font | **Fraunces** (`font-display`) |
| UI font | **Sora** (`font-sans`) |
| Mono | **IBM Plex Mono** (`font-mono`) |
| Brand | Teal `#0d7377` → `bg-brand` / `text-brand` |
| Accent | Gold `#d4a017` → `bg-accent` (sparingly) |
| Ink / muted | `text-ink`, `text-ink-muted`, `text-ink-subtle` |
| Surfaces | `bg-canvas`, `bg-surface`, `bg-surface-raised` |
| Borders | `border-border`, `border-border-strong` |
| Radius | `rounded-sm` … `rounded-xl` (theme radii) |
| Elevation | `shadow-xs` … `shadow-lg` |
| Motion | `animate-fade-in`, `animate-slide-up`, `animate-scale-in`, `transition-theme` |
| Status | `danger` / `success` / `warning` (+ `*-soft` backgrounds) |

### Rules for consistent UI

1. **Prefer Tailwind theme utilities** mapped from Harbor Ink (`bg-brand`, `text-ink-muted`, `shadow-md`, …).
2. **No hardcoded hex/rgb** in components unless extending `theme.css` first.
3. **No Inter / Roboto / Arial / system-ui as primary UI fonts** — Sora + Fraunces only.
4. **Avoid** purple-indigo gradients, cream+terracotta “AI default” looks, and dark-mode-first layouts (dark mode optional, not MVP).
5. When adding **shadcn**, map its CSS variables to Harbor Ink tokens in `theme.css` / globals — one visual language.
6. Page entry motion: prefer `animate-slide-up` or `animate-fade-in` on primary panels; respect `prefers-reduced-motion`.
7. Spacing: Tailwind scale is fine; for custom CSS use `--space-*` from theme.

```tsx
// Good
<section className="rounded-xl border border-border bg-surface p-8 shadow-md animate-slide-up">
  <h1 className="font-display text-3xl text-ink">Employees</h1>
  <p className="text-ink-muted">Active directory</p>
</section>

// Bad — ad-hoc palette / fonts
<section style={{ background: '#f4f1ea', fontFamily: 'Inter' }}>
```

---

## shadcn/ui + Tailwind

- Init: `npx shadcn@latest init` in `frontend/` — **point colors/radius at Harbor Ink** (see § Design system).
- Add components as needed: `button`, `input`, `table`, `dialog`, `select`, `card`, `badge`, `toast`.
- **Do not** edit `presentation/components/ui/*` heavily — wrap in project components instead.
- Tailwind for layout/spacing; **Harbor Ink / shadcn tokens** for color, radius, shadow — never one-off values.
- Dark mode: optional; not required for MVP.

---

## React best practices (avoid code smells)

| Smell | Fix |
|-------|-----|
| God component | Split into page + presentation components |
| Prop drilling > 2 levels | Context for layout/auth shell only; Redux for server state |
| useEffect for data fetch | RTK Query hooks |
| Duplicate server state in useState | Single source: RTK Query cache |
| Missing key on lists | Stable `id` keys |
| Inline functions in memoized children | `useCallback` or move out |
| Form state in Redux | react-hook-form local state |
| API types duplicated | `domain/types/` mirrors backend DTOs — one file per domain, no barrel |
| Giant useEffect chains | Split by concern or use RTK Query lifecycle |

---

## State management

```
Redux store
├── auth (slice) — token, isAuthenticated, persisted to localStorage
└── baseApi (RTK Query) — all server data
```

- **No** Redux slices per domain entity — RTK Query handles server cache.
- Invalidate tags on mutations: `invalidatesTags: ['Employee', 'SalaryDraft']`.
- `axiosBaseQuery` injects Bearer token from `auth` slice.

---

## Linting & formatting

- ESLint + `eslint-plugin-react-hooks` + TypeScript ESLint.
- Run `yarn lint` every milestone; fix all errors.
- Prefer explicit return types on exported functions in `domain/` and `infrastructure/`.

---

## API integration

- Base URL: `import.meta.env.VITE_API_URL`
- OpenAPI reference: backend `/api/docs-json` (user must have backend running for manual test)
- Mirror DTOs in `domain/types/` — keep in sync when backend announces changes
- 401 → dispatch `logout()` → redirect `/login`

### Surfacing API errors

**Do not** inline `error.status` / Nest `message` parsing in pages. Use the shared helpers:

| Piece | Path | Role |
|-------|------|------|
| `extractApiError` / `formatApiErrorMessage` | `infrastructure/api/extract-api-error.ts` | Normalize RTK/`axiosBaseQuery` errors |
| `ErrorHandler` | `presentation/components/feedback/error-handler.tsx` | Render error UI |
| `ErrorAlert` | `presentation/components/feedback/error-alert.tsx` | Default Harbor Ink danger card |

```tsx
// Default card (most list/detail pages)
{isError ? (
  <ErrorHandler error={error} defaultMessage="Unable to load employees" />
) : null}

// Custom presentation component (toast shell, banner, …)
<ErrorHandler
  error={error}
  defaultMessage="Save failed"
  presentation={ToastError}
/>

// Arbitrary node via render prop
<ErrorHandler error={error} defaultMessage="Save failed">
  {({ message, extracted }) => (
    <div role="status" data-http={extracted.status}>{message}</div>
  )}
</ErrorHandler>

// Message-only (e.g. form field / LoginForm serverError prop)
serverError={error ? formatApiErrorMessage(error, 'Unable to sign in') : null}
// or branch on extractApiError(error).status === 401
```

**Rules:**
1. Always pass a clear `defaultMessage` for the feature.
2. Prefer `ErrorHandler` for page/section failures; use `extractApiError` / `formatApiErrorMessage` when the host already has its own UI (forms, toasts).
3. Do not duplicate HTTP-status string concatenation in components.

---

## Testing (per milestone)

| Type | Tool | What to test |
|------|------|--------------|
| Component | Vitest + RTL | Forms, tables, filters, empty/loading states |
| Hook | Vitest | Custom hooks in `presentation/hooks/` |
| API slice | Vitest + mock axios | RTK Query endpoints with MSW or mocked baseQuery |

Map tests to **Given/When/Then** in `docs/development-plan.md`.

---

## Backend dependency check

Before starting a frontend milestone, read **Phase 3** in `docs/development-plan.md` — each M3.x lists **Backend deps** and **Required APIs**.

**Wisdom (contracts):** Parallel frontend/backend needs a frozen API contract first. This project is **backend-first** — Phase 2 is done — so use the **live API** as the contract (`/api/docs`, `/api/docs-json`), not invented shapes. Details: `docs/development-plan.md` § Wisdom — API contract.

Before coding:

```markdown
Backend module(s) required: <from development-plan M3.x table>
Required APIs: <listed endpoints>
Contract source: running backend Swagger /api/docs (+ /api/docs-json)
```

If a required endpoint is missing or differs from Swagger, **stop** and report the mismatch — do not invent alternate paths.

---

## Workflow per milestone

1. Confirm backend deps + required APIs from `docs/development-plan.md` Phase 3; verify against Swagger.
2. Read milestone in `docs/development-plan.md`.
3. Read pages/API in `docs/technical-plan.md`; prefer live `/api/docs-json` for request/response shapes.
4. Implement presentation + infrastructure for scope only.
5. Write component tests.
6. Run `cd frontend && yarn test && yarn lint`.
7. Draft **commit message(s)** per § Commit messages below.
8. Post **Milestone Completion Report** with manual UI test steps and suggested commit message(s).
9. **STOP.** Wait for `APPROVED: M3.x`. Commit only if the user explicitly requests it.

---

## Commit messages

Include **at least one ready-to-use commit message** in every Milestone Completion Report. Do **not** commit unless the user asks.

### Format

```
<type>(<scope>): <milestone-id> <imperative summary>
```

| Part | Rule | Example |
|------|------|---------|
| `type` | `feat` (default), `test`, `chore`, `fix` | `feat` |
| `scope` | Page, feature, or layer | `employees`, `auth`, `dashboard` |
| `milestone-id` | Exact id from development plan | `M3.4` |
| `summary` | Imperative, lowercase, no period, ≤72 chars total line | `add employees directory page` |

**One commit per milestone** is preferred.

```
feat(employees): M3.4 add employees directory with filters and pagination
```

Optional body for integration notes:

```
feat(login): M3.2 add login page with jwt auth slice

- RTK Query baseApi injects bearer from auth slice
- Redirect to /employees on success
```

### Examples by milestone

| Milestone | Suggested message |
|-----------|-------------------|
| M0.3 | `chore(frontend): M0.3 scaffold vite react app with tailwind` |
| M3.1 | `feat(app): M3.1 add router redux store and api client` |
| M3.2 | `feat(auth): M3.2 add login page and token persistence` |
| M3.3 | `feat(layout): M3.3 add auth shell with header and sidebar` |
| M3.4 | `feat(employees): M3.4 add employees directory page` |
| M3.8 | `feat(salary-drafts): M3.8 add drafts list commit and rollback ui` |
| M3.9 | `feat(dashboard): M3.9 add dashboard with display currency filter` |
| FIX response | `fix(employees): M3.4 fix empty state when filters return no rows` |

### Report snippet

Always paste this block in the completion report:

```markdown
### Suggested commit
\`\`\`
feat(employees): M3.4 add employees directory with filters and pagination
\`\`\`
Files to stage: `frontend/src/presentation/pages/employees-page.tsx`, related components, API slice, tests.
```

---

## Manual test checklist (include in report)

For each UI milestone, provide:

1. `yarn dev` URL
2. Login credentials (from backend `.env.example`)
3. Click path to verify feature
4. Expected visible outcome
5. Screenshot description if helpful

---

## Do not

- Touch `backend/` files.
- Create or use barrel `index.ts` / `index.tsx` re-export files.
- Import from folder paths that resolve via `index.ts`.
- Implement pages before backend API is approved.
- Fetch in components with raw `fetch` — use RTK Query.
- Skip ESLint fixes.
- Proceed without user `APPROVED`.
- Store server data in local `useState` when RTK Query should own it.
- Invent ad-hoc colors, fonts, or shadows — extend Harbor Ink in `presentation/styles/` instead.
- Inline RTK/axios error status parsing in pages — use `extractApiError` / `ErrorHandler` (see § Surfacing API errors).
