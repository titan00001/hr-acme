# Agent Runbook — HR Incubyte

Two specialized agents build this project in parallel where possible, gated by **milestones** and **user sign-off** before advancing.

## Agents

| Agent | Runbook | Workspace | Milestones |
|-------|---------|-----------|------------|
| **Backend** | [backend-agent.md](./backend-agent.md) | `backend/` | M0.2, M1.1–M1.3, M2.1–M2.8 |
| **Frontend** | [frontend-agent.md](./frontend-agent.md) | `frontend/` | M0.3, M3.1–M3.10 |

Shared protocol: [milestone-gate.md](./milestone-gate.md)

## How to run

### 1. Start a session

Open **two Cursor agent chats** (or sequential sessions):

```
Backend agent  → paste prompt from backend-agent.md § Bootstrap Prompt
Frontend agent → paste prompt from frontend-agent.md § Bootstrap Prompt
```

Each agent reads:
- Its runbook (`agents/<agent>-agent.md`)
- `docs/development-plan.md` (current milestone)
- `docs/technical-plan.md` (module detail)
- `agents/milestone-gate.md` (stop rules)

### 2. Milestone order (recommended)

Agents can run **in parallel** only when there is no API dependency. Follow this sequence:

| Order | Backend | Frontend | Dependency |
|-------|---------|----------|------------|
| 1 | M0.2 | M0.3 | None — parallel OK |
| 2 | M1.1 → M1.3 | — | Backend first |
| 3 | M2.1 Settings | — | Backend |
| 4 | M2.2 Currency | — | Backend |
| 5 | M2.3 Employees | M3.1 App foundation | Backend auth ready (M1.2) for M3.2+ |
| 6 | M2.4–M2.8 | M3.2 Login (needs `POST /auth/login`) | Frontend waits for backend endpoint |
| 7 | — | M3.3–M3.10 | Each UI milestone needs its API from M2.x |

**Rule:** Frontend agent must not implement a page until the corresponding backend milestone is **gate-approved** (see milestone-gate.md).

### 3. Gate before next module

After each milestone, the agent **stops** and posts a **Milestone Completion Report** (template in milestone-gate.md). The user tests manually. Only proceed when the user replies:

```
APPROVED: <milestone-id>
```

or requests fixes:

```
FIX: <milestone-id> — <description>
```

### 4. Contract between agents

- **API contract:** `backend` `/api/docs-json` + `docs/technical-plan.md` API tables
- **Types:** Frontend mirrors backend DTOs in `frontend/src/domain/types/`
- **Breaking changes:** Backend agent must announce in completion report; Frontend agent waits for approval before updating consumers

## Source of truth

| Doc | Purpose |
|-----|---------|
| `docs/requirements.md` | What to build |
| `docs/architecture.md` | Stack, domain model, routes |
| `docs/technical-plan.md` | Per-module implementation detail |
| `docs/development-plan.md` | Milestones + Given/When/Then tests |
| `docs/business-specification.md` | Business rules |

## Commits

- One or more commits **per milestone**
- Message format: `feat(<module>): <milestone-id> <short description>`
- Example: `feat(employees): M2.3 employee CRUD and left list`
