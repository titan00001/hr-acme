import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { setupSwagger } from '../src/common/swagger/setup-swagger';
import { LoginResponseDto } from '../src/modules/auth/adapters/inbound/login-response.dto';
import { CurrencyRateResponseDto } from '../src/modules/currency-rates/adapters/inbound/currency-rate-response.dto';
import { SyncCurrencyRatesResponseDto } from '../src/modules/currency-rates/adapters/inbound/sync-currency-rates-response.dto';
import {
  createTestModuleBuilder,
  sharedCurrencyRateRepository,
  sharedSettingsRepository,
} from './test-app.util';

describe('Currency rates (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.HR_USERNAME = 'admin';
    process.env.HR_PASSWORD = 'secret';
    process.env.JWT_EXPIRES_IN = '8h';
    process.env.EXCHANGE_RATE_API_KEY = 'test-key';
  });

  beforeEach(async () => {
    sharedSettingsRepository.clear();
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

  it('POST /settings/currency-rates/sync upserts rates', async () => {
    const response = await request(app.getHttpServer())
      .post('/settings/currency-rates/sync')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = response.body as SyncCurrencyRatesResponseDto;
    expect(body.synced).toBeGreaterThan(0);
    expect(body.lastFxSyncAt).toBeDefined();
  });

  it('GET /settings/currency-rates returns synced rates', async () => {
    await request(app.getHttpServer())
      .post('/settings/currency-rates/sync')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const response = await request(app.getHttpServer())
      .get('/settings/currency-rates')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = response.body as CurrencyRateResponseDto[];
    const firstRate = body[0];
    expect(body.length).toBeGreaterThan(0);
    expect(firstRate?.baseCurrency).toBe('USD');
    expect(typeof firstRate?.targetCurrency).toBe('string');
    expect(typeof firstRate?.rate).toBe('number');
  });

  it('GET /settings/currency-rates returns 401 without token', () => {
    return request(app.getHttpServer())
      .get('/settings/currency-rates')
      .expect(401);
  });
});
