import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { setupSwagger } from '../src/common/swagger/setup-swagger';
import { createTestModule } from './test-app.util';

interface OpenApiDocument {
  paths: Record<string, unknown>;
  components?: {
    securitySchemes?: Record<string, unknown>;
  };
}

describe('Swagger (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture = await createTestModule();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    setupSwagger(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/docs-json returns OpenAPI spec', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/docs-json')
      .expect(200);

    const document = response.body as OpenApiDocument;
    expect(document.paths).toHaveProperty('/health');
    expect(document.paths).toHaveProperty('/auth/login');
    expect(document.paths).toHaveProperty('/auth/me');
    expect(document.paths).toHaveProperty('/settings');
    expect(document.components?.securitySchemes).toHaveProperty('JWT-auth');
  });

  it('GET /api/docs serves Swagger UI without auth', () => {
    return request(app.getHttpServer()).get('/api/docs').expect(200);
  });
});
