import { Module } from '@nestjs/common';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { DatabaseModule } from '../src/common/database/database.module';
import { LoginResponseDto } from '../src/modules/auth/adapters/inbound/login-response.dto';

@Module({})
class MockDatabaseModule {}

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.HR_USERNAME = 'admin';
    process.env.HR_PASSWORD = 'secret';
    process.env.JWT_EXPIRES_IN = '8h';
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideModule(DatabaseModule)
      .useModule(MockDatabaseModule)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /auth/login returns JWT for valid credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'secret' })
      .expect(200);

    const body = response.body as LoginResponseDto;
    expect(body.accessToken).toEqual(expect.any(String));
    expect(body.expiresIn).toBe(28800);
  });

  it('POST /auth/login returns 401 for invalid credentials', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'wrong' })
      .expect(401);
  });

  it('GET /auth/me returns 401 without token', () => {
    return request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  it('GET /auth/me returns profile with valid token', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'secret' })
      .expect(200);

    const loginBody = loginResponse.body as LoginResponseDto;

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${loginBody.accessToken}`)
      .expect(200)
      .expect({ username: 'admin' });
  });
});
