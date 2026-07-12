# Deployment Runbook

Deploy **backend → Railway** (NestJS + PostgreSQL) and **frontend → Vercel** (React SPA).

**Order matters:** deploy backend first, then frontend, then update backend CORS with the Vercel URL.

---

## Overview

| App | Platform | URL (example) |
|-----|----------|---------------|
| Backend API | Railway | `https://hr-incubyte-api.up.railway.app` |
| Frontend SPA | Vercel | `https://hr-incubyte.vercel.app` |
| Database | Railway PostgreSQL | internal `DATABASE_URL` (not public) |

---

## 1. Railway — Backend + PostgreSQL

### 1.1 Create project

1. [railway.app](https://railway.app) → **New Project**
2. **Deploy from GitHub repo** → select this repository
3. Add **PostgreSQL** plugin to the project (Railway provisions `DATABASE_URL` automatically)

### 1.2 Configure backend service

Open the **backend** service (not Postgres) → **Settings**:

| Setting | Value |
|---------|-------|
| **Root Directory** | `backend` |
| **Build Command** | `yarn install --frozen-lockfile && yarn build` |
| **Start Command** | `yarn migration:run && yarn start:prod` |
| **Watch Paths** | `backend/**` |

Railway sets `PORT` automatically — the app reads it via `ConfigService`.

### 1.3 Environment variables

In Railway → backend service → **Variables**:

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | |
| `DATABASE_URL` | *(from Postgres plugin)* | Reference: `${{Postgres.DATABASE_URL}}` |
| `JWT_SECRET` | long random string | e.g. `openssl rand -base64 32` |
| `JWT_EXPIRES_IN` | `8h` | optional |
| `HR_USERNAME` | your demo login | e.g. `hr@acme.com` |
| `HR_PASSWORD` | strong password | demo credentials |
| `FRONTEND_URL` | Vercel URL | set after frontend deploy — see §3 |
| `EXCHANGE_RATE_API_KEY` | your API key | [exchangerate-api.com](https://www.exchangerate-api.com/) |
| `DEMO_SEED_COUNT` | `10000` | optional |

> **Tip:** Leave `FRONTEND_URL` as a placeholder (`https://placeholder.vercel.app`) for the first deploy; update it once Vercel gives you the real URL.

### 1.4 Deploy & verify

1. **Deploy** (or push to the connected branch)
2. Generate a public domain: service → **Settings → Networking → Generate Domain**
3. Verify:

```bash
curl https://<railway-domain>/health
# → {"status":"ok"}  (or similar)
```

4. Open Swagger: `https://<railway-domain>/api/docs`

### 1.5 Migrations (alternative)

If you prefer not to run migrations on every start, use Railway's **Pre-deploy command** instead:

```
yarn migration:run
```

And change **Start Command** to:

```
yarn start:prod
```

Or run migrations once from your machine against Railway Postgres:

```bash
cd backend
DATABASE_URL="<railway-postgres-url>" yarn migration:run
```

---

## 2. Vercel — Frontend

### 2.1 Import project

1. [vercel.com](https://vercel.com) → **Add New → Project**
2. Import the same GitHub repository
3. Configure:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Root Directory** | `frontend` |
| **Build Command** | `yarn build` |
| **Output Directory** | `dist` |
| **Install Command** | `yarn install --frozen-lockfile` |
| **Node.js Version** | `24` |

### 2.2 Environment variables

In Vercel → Project → **Settings → Environment Variables**:

| Variable | Value | Environments |
|----------|-------|--------------|
| `VITE_API_URL` | `https://<railway-domain>` | Production, Preview |

> `VITE_*` vars are baked in at **build time**. Redeploy after changing `VITE_API_URL`.

### 2.3 SPA routing (`vercel.json`)

React Router uses client-side routes. Add this file so deep links and refreshes work:

**`frontend/vercel.json`**

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Commit and push — Vercel picks it up on the next deploy.

### 2.4 Deploy & verify

1. **Deploy**
2. Note the production URL, e.g. `https://hr-incubyte.vercel.app`
3. Open the URL → login page should load
4. Try logging in (uses Railway API via `VITE_API_URL`)

---

## 3. Wire CORS (backend ↔ frontend)

The backend only allows requests from `FRONTEND_URL`.

1. Railway → backend service → **Variables**
2. Set `FRONTEND_URL` to your **exact** Vercel production URL (no trailing slash):

```
https://hr-incubyte.vercel.app
```

3. Redeploy the backend service (Railway redeploys automatically on variable change)

If you use Vercel **preview** deployments, either:
- set `FRONTEND_URL` to the preview URL temporarily, or
- extend backend CORS to accept multiple origins (future enhancement)

---

## 4. Post-deploy smoke test

Run through this checklist on production:

| # | Step | Expected |
|---|------|----------|
| 1 | Open Vercel URL | Login page |
| 2 | Login with `HR_USERNAME` / `HR_PASSWORD` | Dashboard shell loads |
| 3 | Settings → Demo → **Seed** | ~10k employees created |
| 4 | Employees → search / paginate | List loads quickly |
| 5 | Dashboard → change `displayCurrency` | Charts update |
| 6 | Settings → Currency → **Sync** | FX rates refresh |
| 7 | Onboard → Assign salary → Commit draft | Salary appears on employee |
| 8 | `GET /health` on Railway URL | 200 OK |
| 9 | `/api/docs` on Railway URL | Swagger UI loads |

---

## 5. Environment reference

### Backend (`backend/.env.example`)

```
NODE_ENV=production
DATABASE_URL=          # Railway Postgres
JWT_SECRET=
JWT_EXPIRES_IN=8h
HR_USERNAME=
HR_PASSWORD=
FRONTEND_URL=https://your-app.vercel.app
EXCHANGE_RATE_API_KEY=
PORT=3001              # Railway overrides this
DEMO_SEED_COUNT=10000
```

### Frontend (`frontend/.env.example`)

```
VITE_API_URL=https://your-api.up.railway.app
```

---

## 6. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Login fails / network error | Wrong `VITE_API_URL` or not redeployed after change | Set correct Railway URL in Vercel; redeploy frontend |
| CORS error in browser console | `FRONTEND_URL` mismatch | Set exact Vercel URL on Railway; redeploy backend |
| 404 on `/employees/...` refresh | Missing SPA rewrite | Add `frontend/vercel.json` (§2.3) |
| 500 on API calls | DB not migrated | Check Railway logs; run `yarn migration:run` |
| FX Sync fails | Missing/invalid `EXCHANGE_RATE_API_KEY` | Add key in Railway variables |
| App won't start on Railway | Build failed or wrong root dir | Confirm root = `backend`, Node 24, check deploy logs |

**Logs:**
- Railway → backend service → **Deployments → View logs**
- Vercel → Project → **Deployments → Build / Function logs**

---

## 7. Redeploy checklist

When pushing code changes:

| Change in… | Redeploy |
|------------|----------|
| `backend/**` | Railway (auto if GitHub connected) |
| `frontend/**` | Vercel (auto if GitHub connected) |
| New DB migration | Railway (migrations run on start) |
| `VITE_API_URL` changed | Vercel only |
| `FRONTEND_URL` changed | Railway only |

---

## 8. Security notes (demo / assignment)

- Use strong `JWT_SECRET` and `HR_PASSWORD` in production
- Do not commit `.env` files
- Railway Postgres URL is private by default — good
- Swagger (`/api/docs`) is public; acceptable for demo/assessment
- Rotate demo credentials after the presentation if the URL stays live
