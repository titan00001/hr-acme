# Frontend E2E (Playwright)

Smoke tests for M4.1 critical paths against a **running backend** + Vite app.

## Prerequisites

1. Node 24 (`nvm use` from repo root)
2. Backend `.env` with `HR_USERNAME`, `HR_PASSWORD` (and DB up)
3. Backend: `cd backend && yarn start:dev` (default `http://localhost:3001`)
4. Frontend `.env` with `VITE_API_BASE_URL` pointing at the API

Playwright loads credentials from `backend/.env` automatically.

## Install browsers (once)

```bash
cd frontend
yarn playwright install chromium
```

## Run

```bash
cd frontend
# Starts Vite via webServer if needed; reuses :5173 when already up
yarn test:e2e

# Fast smoke only (skip 10k demo seed)
yarn test:e2e e2e/smoke/01-salary-lifecycle.spec.ts e2e/smoke/02-relieve.spec.ts e2e/smoke/04-templates.spec.ts

# Full suite including demo clear/seed (can take several minutes)
yarn test:e2e
```

Optional: `E2E_BASE_URL=http://127.0.0.1:5173 yarn test:e2e`

## Specs

| Spec | Flow |
|------|------|
| `01-salary-lifecycle` | Login → onboard → assign draft → commit → dashboard |
| `02-relieve` | Login → onboard → relieve → left employees |
| `03-demo-seed` | Settings → clear/seed → active/left counts |
| `04-templates` | Login → create template → edit → delete unused |
