# AI-Assisted Development

## Agent runbooks

Development is driven by two specialized agents with milestone gates. See [`agents/README.md`](../agents/README.md).

| Agent | Runbook | Focus |
|-------|---------|-------|
| Backend | [`agents/backend-agent.md`](../agents/backend-agent.md) | NestJS, Postgres, Ports & Adapters, SOLID, GoF patterns |
| Frontend | [`agents/frontend-agent.md`](../agents/frontend-agent.md) | React, shadcn/ui, Harbor Ink theme, presentation + infrastructure layers |

Each milestone requires user `APPROVED: <id>` before the next module — see [`agents/milestone-gate.md`](../agents/milestone-gate.md).

---

| Activity | AI | Human |
|----------|-----|-------|
| Spec & architecture | Draft structure | Finalize scope, entities, NestJS module boundaries |
| NestJS modules | Scaffold controllers, services, DTOs | Review DI wiring, business rules |
| TypeORM entities | Generate entity/migration boilerplate | Validate relations and indexes |
| UI components | shadcn + Harbor Ink tokens (theme.css) | UX flow, auth routing, visual consistency |
| Seed script | Faker-based data generation | Verify distributions, FK integrity |
| Tests | Test skeletons | Assert revision immutability, FX normalization |

**Principles:** AI accelerates boilerplate; human owns compensation logic, currency normalization, and revision rules. Document prompts here as work progresses.

**Example prompts:**
- *"NestJS employees module: TypeORM entity, paginated list with filters, onboard/relieve endpoints."*
- *"Currency normalization service: convert amounts to base currency using Settings.fxRates."*
- *"Auth layout: GlobalHeader + icon Sidebar for Employees, Dashboard, Settings."*
- *"Settings Demo section: Seed 10k employees and Clear all with confirmation dialogs."*
- *"NestJS Swagger: DocumentBuilder with Bearer JWT scheme, @ApiBearerAuth on protected controllers, /api/docs UI."*
