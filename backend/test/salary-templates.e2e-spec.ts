import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { setupSwagger } from '../src/common/swagger/setup-swagger';
import { LoginResponseDto } from '../src/modules/auth/adapters/inbound/login-response.dto';
import { TemplateListResponseDto } from '../src/modules/salary-templates/adapters/inbound/template-list-response.dto';
import { TemplateResponseDto } from '../src/modules/salary-templates/adapters/inbound/template-response.dto';
import {
  createTestModuleBuilder,
  sharedSalaryTemplateRepository,
  sharedSettingsRepository,
} from './test-app.util';

describe('Salary Templates (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;

  const indiaTemplate = {
    name: 'India Standard',
    country: 'India',
    currency: 'INR',
    components: {
      basePay: 1_200_000,
      allowances: 50_000,
      bonus: 100_000,
      stock: { quantity: 100, vestingDate: '2027-01-01' },
    },
  };

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.HR_USERNAME = 'admin';
    process.env.HR_PASSWORD = 'secret';
    process.env.JWT_EXPIRES_IN = '8h';
  });

  beforeEach(async () => {
    sharedSettingsRepository.clear();
    sharedSalaryTemplateRepository.clear();

    const moduleFixture: TestingModule =
      await createTestModuleBuilder().compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    setupSwagger(app);
    await app.init();

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'secret' })
      .expect(200);

    accessToken = (loginResponse.body as LoginResponseDto).accessToken;
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /salary-templates creates v1', async () => {
    const response = await request(app.getHttpServer())
      .post('/salary-templates')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(indiaTemplate)
      .expect(201);

    const body = response.body as TemplateResponseDto;
    expect(body.name).toBe('India Standard');
    expect(body.version).toBe(1);
    expect(body.isAssigned).toBe(false);
    expect(body.latestVersion).toBe(1);
    expect(body.components.basePay).toBe(1_200_000);
  });

  it('POST /salary-templates/:id/versions creates v2', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/salary-templates')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(indiaTemplate)
      .expect(201);

    const v1 = createResponse.body as TemplateResponseDto;

    const versionResponse = await request(app.getHttpServer())
      .post(`/salary-templates/${v1.id}/versions`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        ...indiaTemplate,
        components: { ...indiaTemplate.components, basePay: 1_400_000 },
      })
      .expect(201);

    const v2 = versionResponse.body as TemplateResponseDto;
    expect(v2.version).toBe(2);
    expect(v2.name).toBe('India Standard');
    expect(v2.components.basePay).toBe(1_400_000);
    expect(v2.latestVersion).toBe(2);

    const getV1 = await request(app.getHttpServer())
      .get(`/salary-templates/${v1.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect((getV1.body as TemplateResponseDto).latestVersion).toBe(2);
  });

  it('PATCH /salary-templates/:id rejects edit on assigned template', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/salary-templates')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(indiaTemplate)
      .expect(201);

    const created = createResponse.body as TemplateResponseDto;

    await request(app.getHttpServer())
      .patch(`/salary-templates/${created.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ components: { basePay: 1_250_000 } })
      .expect(200);

    const current = await sharedSalaryTemplateRepository.findById(created.id);
    expect(current).not.toBeNull();
    await sharedSalaryTemplateRepository.update({
      ...current!,
      isAssigned: true,
    });

    await request(app.getHttpServer())
      .patch(`/salary-templates/${created.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ components: { basePay: 999 } })
      .expect(400);
  });

  it('GET /salary-templates filters by country and currency', async () => {
    await request(app.getHttpServer())
      .post('/salary-templates')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(indiaTemplate)
      .expect(201);

    await request(app.getHttpServer())
      .post('/salary-templates')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'US Standard',
        country: 'US',
        currency: 'USD',
        components: { basePay: 100_000 },
      })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/salary-templates?country=India&currency=INR')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = response.body as TemplateListResponseDto;
    expect(body.total).toBe(1);
    expect(body.data[0]?.name).toBe('India Standard');
  });

  it('GET /salary-templates filters by search and isAssigned', async () => {
    const created = await request(app.getHttpServer())
      .post('/salary-templates')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(indiaTemplate)
      .expect(201);

    await request(app.getHttpServer())
      .post('/salary-templates')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'India Contract',
        country: 'India',
        currency: 'INR',
        components: { basePay: 900_000 },
      })
      .expect(201);

    const indiaId = (created.body as TemplateResponseDto).id;
    const current = await sharedSalaryTemplateRepository.findById(indiaId);
    await sharedSalaryTemplateRepository.update({
      ...current!,
      isAssigned: true,
    });

    const bySearch = await request(app.getHttpServer())
      .get('/salary-templates?search=Contract')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect((bySearch.body as TemplateListResponseDto).total).toBe(1);
    expect((bySearch.body as TemplateListResponseDto).data[0]?.name).toBe(
      'India Contract',
    );

    const assigned = await request(app.getHttpServer())
      .get('/salary-templates?isAssigned=true')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect((assigned.body as TemplateListResponseDto).total).toBe(1);
    expect((assigned.body as TemplateListResponseDto).data[0]?.name).toBe(
      'India Standard',
    );
  });

  it('DELETE /salary-templates/:id removes unused template', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/salary-templates')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(indiaTemplate)
      .expect(201);

    const created = createResponse.body as TemplateResponseDto;

    await request(app.getHttpServer())
      .delete(`/salary-templates/${created.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/salary-templates/${created.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });

  it('DELETE /salary-templates/:id rejects assigned template', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/salary-templates')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(indiaTemplate)
      .expect(201);

    const created = createResponse.body as TemplateResponseDto;
    const current = await sharedSalaryTemplateRepository.findById(created.id);
    await sharedSalaryTemplateRepository.update({
      ...current!,
      isAssigned: true,
    });

    await request(app.getHttpServer())
      .delete(`/salary-templates/${created.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(400);
  });

  it('GET /salary-templates returns 401 without token', () => {
    return request(app.getHttpServer()).get('/salary-templates').expect(401);
  });
});
