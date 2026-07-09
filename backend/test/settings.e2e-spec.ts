import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { setupSwagger } from '../src/common/swagger/setup-swagger';
import { LoginResponseDto } from '../src/modules/auth/adapters/inbound/login-response.dto';
import { SettingsResponseDto } from '../src/modules/settings/adapters/inbound/settings-response.dto';
import { createTestModule } from './test-app.util';

describe('Settings (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.HR_USERNAME = 'admin';
    process.env.HR_PASSWORD = 'secret';
    process.env.JWT_EXPIRES_IN = '8h';
  });

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

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'secret' })
      .expect(200);

    accessToken = (loginResponse.body as LoginResponseDto).accessToken;
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /settings returns defaults', async () => {
    const response = await request(app.getHttpServer())
      .get('/settings')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = response.body as SettingsResponseDto;
    expect(body.baseCurrency).toBe('USD');
    expect(body.supportedCurrencies).toEqual([
      'USD',
      'GBP',
      'INR',
      'EUR',
      'SGD',
    ]);
    expect(body.stockPrice).toBe(150);
  });

  it('PATCH /settings partially updates stock price', async () => {
    const response = await request(app.getHttpServer())
      .patch('/settings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ stockPrice: 175, stockPriceCurrency: 'USD' })
      .expect(200);

    const body = response.body as SettingsResponseDto;
    expect(body.stockPrice).toBe(175);
    expect(body.stockPriceCurrency).toBe('USD');
    expect(body.baseCurrency).toBe('USD');
  });

  it('GET /settings returns 401 without token', () => {
    return request(app.getHttpServer()).get('/settings').expect(401);
  });
});
