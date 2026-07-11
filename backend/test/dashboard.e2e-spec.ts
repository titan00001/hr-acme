import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { EmploymentType } from '../src/common/enums/employment-type.enum';
import { PaymentCycle } from '../src/common/enums/payment-cycle.enum';
import { setupSwagger } from '../src/common/swagger/setup-swagger';
import { LoginResponseDto } from '../src/modules/auth/adapters/inbound/login-response.dto';
import { DashboardSummaryDto } from '../src/modules/dashboard/adapters/inbound/dashboard-response.dto';
import { EmployeeResponseDto } from '../src/modules/employees/adapters/inbound/employee-response.dto';
import {
  createTestModuleBuilder,
  sharedCurrencyRateRepository,
  sharedEmployeeRepository,
  sharedSalaryDraftRepository,
  sharedSalaryRecordRepository,
  sharedSettingsRepository,
} from './test-app.util';

describe('Dashboard (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.HR_USERNAME = 'admin';
    process.env.HR_PASSWORD = 'secret';
    process.env.JWT_EXPIRES_IN = '8h';
  });

  beforeEach(async () => {
    sharedSettingsRepository.clear();
    sharedEmployeeRepository.clear();
    sharedSalaryDraftRepository.clear();
    sharedSalaryRecordRepository.clear();
    sharedCurrencyRateRepository.clear();

    sharedCurrencyRateRepository.seed({
      id: 'rate-usd-inr',
      baseCurrency: 'USD',
      targetCurrency: 'INR',
      rate: '80.000000',
      syncedAt: new Date(),
    });

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

  async function createEmployee(input: {
    employeeId: string;
    name: string;
    email: string;
    country: string;
  }): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/employees')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        ...input,
        employmentType: EmploymentType.Permanent,
        joiningDate: '2026-01-15',
      })
      .expect(201);

    return (response.body as EmployeeResponseDto).id;
  }

  async function commitSalary(
    employeeId: string,
    input: {
      baseSalary: number;
      currency: string;
      effectiveDate: string;
      reason?: string;
    },
  ): Promise<void> {
    const draftResponse = await request(app.getHttpServer())
      .post(`/employees/${employeeId}/salary/draft`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        effectiveDate: input.effectiveDate,
        baseSalary: input.baseSalary,
        currency: input.currency,
        paymentCycle: PaymentCycle.Monthly,
        reason: input.reason,
      })
      .expect(201);

    const draftId = (draftResponse.body as { id: string }).id;

    await request(app.getHttpServer())
      .post(`/salary-drafts/${draftId}/commit`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  }

  it('summary original breaks down by currency and excludes Left', async () => {
    const activeInr = await createEmployee({
      employeeId: 'E001',
      name: 'Ada',
      email: 'ada@example.com',
      country: 'India',
    });
    const activeUsd = await createEmployee({
      employeeId: 'E002',
      name: 'Grace',
      email: 'grace@example.com',
      country: 'US',
    });
    const leftEmp = await createEmployee({
      employeeId: 'E003',
      name: 'Lefty',
      email: 'lefty@example.com',
      country: 'India',
    });

    await commitSalary(activeInr, {
      baseSalary: 800_000,
      currency: 'INR',
      effectiveDate: '2026-02-01',
    });
    await commitSalary(activeUsd, {
      baseSalary: 100_000,
      currency: 'USD',
      effectiveDate: '2026-02-01',
    });
    await commitSalary(leftEmp, {
      baseSalary: 900_000,
      currency: 'INR',
      effectiveDate: '2026-02-01',
    });

    await request(app.getHttpServer())
      .post(`/employees/${leftEmp}/relieve`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ reason: 'Resigned' })
      .expect(200);

    const original = await request(app.getHttpServer())
      .get('/dashboard/summary?displayCurrency=original')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const originalBody = original.body as DashboardSummaryDto;
    expect(originalBody.activeEmployeeCount).toBe(2);
    expect(originalBody.totalPayroll).toBeNull();
    expect(originalBody.byCurrency).toHaveLength(2);

    const converted = await request(app.getHttpServer())
      .get('/dashboard/summary?displayCurrency=USD')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const convertedBody = converted.body as DashboardSummaryDto;
    expect(convertedBody.activeEmployeeCount).toBe(2);
    expect(convertedBody.totalPayroll).toBe(110000);
  });

  it('trends respects from/to and recent-revisions ignores drafts', async () => {
    const employeeId = await createEmployee({
      employeeId: 'E010',
      name: 'Trend',
      email: 'trend@example.com',
      country: 'US',
    });

    await commitSalary(employeeId, {
      baseSalary: 100_000,
      currency: 'USD',
      effectiveDate: '2026-03-15',
      reason: 'Committed',
    });

    await request(app.getHttpServer())
      .post(`/employees/${employeeId}/salary/draft`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        effectiveDate: '2026-08-01',
        baseSalary: 120_000,
        currency: 'USD',
        paymentCycle: PaymentCycle.Monthly,
        reason: 'Pending draft',
      })
      .expect(201);

    const trends = await request(app.getHttpServer())
      .get(
        '/dashboard/trends?displayCurrency=USD&from=2026-01-01&to=2026-06-30',
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(trends.body).toEqual([
      { date: '2026-03-15', totalPayroll: 100000, currency: 'USD' },
    ]);

    const outside = await request(app.getHttpServer())
      .get(
        '/dashboard/trends?displayCurrency=USD&from=2025-01-01&to=2025-06-30',
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(outside.body).toEqual([]);

    const recent = await request(app.getHttpServer())
      .get('/dashboard/recent-revisions?limit=10')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const recentBody = recent.body as {
      total: number;
      data: Array<{ reason: string | null }>;
    };
    expect(recentBody.total).toBe(1);
    expect(recentBody.data[0]?.reason).toBe('Committed');
  });

  it('GET /dashboard/recent-revisions paginates by createdAt DESC', async () => {
    for (let i = 1; i <= 3; i += 1) {
      const employeeId = await createEmployee({
        employeeId: `E20${i}`,
        name: `Rev ${i}`,
        email: `rev${i}@example.com`,
        country: 'US',
      });
      await commitSalary(employeeId, {
        baseSalary: 100_000 + i,
        currency: 'USD',
        effectiveDate: `2026-0${i}-01`,
        reason: `Commit ${i}`,
      });
    }

    const page1 = await request(app.getHttpServer())
      .get('/dashboard/recent-revisions?page=1&limit=2')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const page1Body = page1.body as {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      data: Array<{ reason: string | null }>;
    };

    expect(page1Body.total).toBe(3);
    expect(page1Body.page).toBe(1);
    expect(page1Body.limit).toBe(2);
    expect(page1Body.totalPages).toBe(2);
    expect(page1Body.data).toHaveLength(2);
    expect(page1Body.data[0]?.reason).toBe('Commit 3');
    expect(page1Body.data[1]?.reason).toBe('Commit 2');

    const page2 = await request(app.getHttpServer())
      .get('/dashboard/recent-revisions?page=2&limit=2')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const page2Body = page2.body as {
      data: Array<{ reason: string | null }>;
    };
    expect(page2Body.data).toHaveLength(1);
    expect(page2Body.data[0]?.reason).toBe('Commit 1');
  });
});
