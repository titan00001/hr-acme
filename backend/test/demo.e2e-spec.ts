import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { setupSwagger } from '../src/common/swagger/setup-swagger';
import { LoginResponseDto } from '../src/modules/auth/adapters/inbound/login-response.dto';
import { DemoSeedResponseDto } from '../src/modules/demo/adapters/inbound/demo-response.dto';
import { DemoStatusResponseDto } from '../src/modules/demo/adapters/inbound/demo-response.dto';
import { SettingsResponseDto } from '../src/modules/settings/adapters/inbound/settings-response.dto';
import {
  createTestModuleBuilder,
  sharedCurrencyRateRepository,
  sharedEmployeeRepository,
  sharedSalaryDraftRepository,
  sharedSalaryRecordRepository,
  sharedSalaryTemplateRepository,
  sharedSettingsRepository,
} from './test-app.util';

describe('Demo (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.HR_USERNAME = 'admin';
    process.env.HR_PASSWORD = 'secret';
    process.env.JWT_EXPIRES_IN = '8h';
    process.env.DEMO_SEED_COUNT = '20';
  });

  beforeEach(async () => {
    sharedSettingsRepository.clear();
    sharedEmployeeRepository.clear();
    sharedSalaryDraftRepository.clear();
    sharedSalaryRecordRepository.clear();
    sharedSalaryTemplateRepository.clear();
    sharedCurrencyRateRepository.clear();

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

  it('seeds once then rejects duplicate seed', async () => {
    const statusBefore = await request(app.getHttpServer())
      .get('/settings/demo/status')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect((statusBefore.body as DemoStatusResponseDto).seeded).toBe(false);

    const seedResponse = await request(app.getHttpServer())
      .post('/settings/demo/seed')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect((seedResponse.body as DemoSeedResponseDto).inserted).toBe(20);

    const statusAfter = await request(app.getHttpServer())
      .get('/settings/demo/status')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect((statusAfter.body as DemoStatusResponseDto).seeded).toBe(true);
    expect((statusAfter.body as DemoStatusResponseDto).employeeCount).toBe(20);

    await request(app.getHttpServer())
      .post('/settings/demo/seed')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(409);
  });

  it('clear removes demo data but preserves settings', async () => {
    await request(app.getHttpServer())
      .post('/settings/demo/seed')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .patch('/settings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ stockPrice: 200, stockPriceCurrency: 'USD' })
      .expect(200);

    expect(sharedEmployeeRepository.all().length).toBe(20);

    await request(app.getHttpServer())
      .post('/settings/demo/clear')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(sharedEmployeeRepository.all().length).toBe(0);
    expect(sharedSalaryRecordRepository.all().length).toBe(0);

    const settings = await request(app.getHttpServer())
      .get('/settings')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = settings.body as SettingsResponseDto;
    expect(Number(body.stockPrice)).toBe(200);
    expect(body.stockPriceCurrency).toBe('USD');
  });
});
