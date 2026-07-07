# AI-Assisted Development

| Activity | AI | Human |
|----------|-----|-------|
| Spec & architecture | Draft structure | Finalize scope, entities, NestJS module boundaries |
| NestJS modules | Scaffold controllers, services, DTOs | Review DI wiring, business rules |
| TypeORM entities | Generate entity/migration boilerplate | Validate relations and indexes |
| UI components | shadcn layout, tables, forms | UX flow, auth routing |
| Seed script | Faker-based data generation | Verify distributions, FK integrity |
| Tests | Test skeletons | Assert revision immutability, FX normalization |

**Principles:** AI accelerates boilerplate; human owns compensation logic, currency normalization, and revision rules. Document prompts here as work progresses.

**Example prompts:**
- *"NestJS employees module: TypeORM entity, paginated list with filters, onboard/relieve endpoints."*
- *"Currency normalization service: convert amounts to base currency using Settings.fxRates."*
- *"Auth layout: GlobalHeader + icon Sidebar for Employees, Dashboard, Settings."*
- *"Settings Demo section: Seed 10k employees and Clear all with confirmation dialogs."*
- *"NestJS Swagger: DocumentBuilder with Bearer JWT scheme, @ApiBearerAuth on protected controllers, /api/docs UI."*
