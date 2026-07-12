# ACME HR — Backend

NestJS 11 + TypeScript REST API. PostgreSQL via TypeORM. JWT auth. Swagger UI.

## Setup

```bash
cp .env.example .env     # configure DATABASE_URL, JWT_SECRET, HR credentials
yarn install
yarn migration:run       # apply all 8 migrations
yarn start:dev           # http://localhost:3001
```

Swagger UI: **http://localhost:3001/api/docs**

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Token signing secret |
| `HR_USERNAME` / `HR_PASSWORD` | Login credentials |
| `FRONTEND_URL` | CORS allow-list (e.g. `http://localhost:5173`) |
| `EXCHANGE_RATE_API_KEY` | ExchangeRate-API key for FX sync |
| `PORT` | Server port (default `3001`) |
| `DEMO_SEED_COUNT` | Employees to seed (default `10000`) |

## Scripts

| Command | Purpose |
|---------|---------|
| `yarn start:dev` | Development server with watch |
| `yarn build` | Production build |
| `yarn start:prod` | Run production build |
| `yarn migration:run` | Apply pending migrations |
| `yarn migration:generate -- src/migrations/<Name>` | Generate new migration |
| `yarn test` | Unit tests (Jest) |
| `yarn test:e2e` | E2E tests (supertest, in-memory mocks) |

## Module Structure

```
src/
├── common/          # Auth (JWT), database, currency FX, pagination, enums
├── modules/
│   ├── auth/        # POST /auth/login, GET /auth/me
│   ├── employees/   # CRUD, onboard, relieve
│   ├── salary-templates/  # Versioned blueprints
│   ├── salary/      # Salary history, template migration
│   ├── salary-drafts/     # Draft create/commit/rollback
│   ├── currency-rates/    # FX sync from ExchangeRate-API
│   ├── dashboard/   # Aggregates, snapshots, reconcile
│   ├── settings/    # Org config
│   ├── demo/        # Seed / clear demo data
│   └── health/      # GET /health
└── migrations/      # 8 TypeORM migrations
```

Each module follows **hexagonal architecture**: `adapters/inbound` (controllers, DTOs) → `application` (services, mappers) → `adapters/outbound` (TypeORM entities, repositories) with `ports/outbound` interfaces.
