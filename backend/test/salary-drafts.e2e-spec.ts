import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { EmploymentType } from '../src/common/enums/employment-type.enum';
import { PaymentCycle } from '../src/common/enums/payment-cycle.enum';
import { setupSwagger } from '../src/common/swagger/setup-swagger';
import { LoginResponseDto } from '../src/modules/auth/adapters/inbound/login-response.dto';
import { EmployeeResponseDto } from '../src/modules/employees/adapters/inbound/employee-response.dto';
import { SalaryDraftListResponseDto } from '../src/modules/salary-drafts/adapters/inbound/salary-draft-list-response.dto';
import { SalaryDraftResponseDto } from '../src/modules/salary-drafts/adapters/inbound/salary-draft-response.dto';
import { SalaryRecordResponseDto } from '../src/modules/salary/adapters/inbound/salary-record-response.dto';
import {
  createTestModuleBuilder,
  sharedCurrencyRateRepository,
  sharedEmployeeRepository,
  sharedSalaryDraftRepository,
  sharedSalaryRecordRepository,
  sharedSettingsRepository,
} from './test-app.util';

describe('Salary Drafts (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;
  let employeeId: string;

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
      rate: '83.333333',
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

    const employeeResponse = await request(app.getHttpServer())
      .post('/employees')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        employeeId: 'E001',
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        country: 'India',
        employmentType: EmploymentType.Permanent,
        joiningDate: '2026-01-15',
      })
      .expect(201);

    employeeId = (employeeResponse.body as EmployeeResponseDto).id;
  });

  afterEach(async () => {
    await app.close();
  });

  const draftPayload = {
    effectiveDate: '2026-04-01',
    baseSalary: 1_200_000,
    currency: 'INR',
    paymentCycle: PaymentCycle.Monthly,
    components: {
      allowances: 50_000,
      bonus: 100_000,
      stock: { quantity: 100, vestingDate: '2027-01-01' },
    },
    reason: 'Initial assign',
  };

  it('POST /employees/:id/salary/draft upserts a draft', async () => {
    const response = await request(app.getHttpServer())
      .post(`/employees/${employeeId}/salary/draft`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(draftPayload)
      .expect(201);

    const body = response.body as SalaryDraftResponseDto;
    expect(body.employeeId).toBe(employeeId);
    expect(body.employee).toEqual({
      employeeId: 'E001',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    });
    expect(body.baseSalary).toBe('1200000.00');
    expect(body.stockPriceAtEntry).toBe('150.00');
    expect(body.stockValueInStockCurrency).toBe('15000.00');
    expect(body.stockValueInSalaryCurrency).toBeTruthy();

    const employee = await request(app.getHttpServer())
      .get(`/employees/${employeeId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect((employee.body as EmployeeResponseDto).currentSalaryId).toBeNull();

    const list = await request(app.getHttpServer())
      .get('/salary-drafts')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const listBody = list.body as SalaryDraftListResponseDto;
    expect(listBody.total).toBe(1);
    expect(listBody.data[0]?.employee).toEqual({
      employeeId: 'E001',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    });
  });

  it('upserts one draft per employee', async () => {
    await request(app.getHttpServer())
      .post(`/employees/${employeeId}/salary/draft`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(draftPayload)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/employees/${employeeId}/salary/draft`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ ...draftPayload, baseSalary: 1_300_000 })
      .expect(201);

    expect(sharedSalaryDraftRepository.count()).toBe(1);

    const list = await request(app.getHttpServer())
      .get('/salary-drafts')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = list.body as SalaryDraftListResponseDto;
    expect(body.total).toBe(1);
    expect(body.data[0]?.baseSalary).toBe('1300000.00');
  });

  it('POST /salary-drafts/:id/commit creates record and clears draft', async () => {
    const draftResponse = await request(app.getHttpServer())
      .post(`/employees/${employeeId}/salary/draft`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(draftPayload)
      .expect(201);

    const draft = draftResponse.body as SalaryDraftResponseDto;

    const commitResponse = await request(app.getHttpServer())
      .post(`/salary-drafts/${draft.id}/commit`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const record = commitResponse.body as SalaryRecordResponseDto;
    expect(record.employeeId).toBe(employeeId);
    expect(record.totalCompensation).toBeTruthy();
    expect(record.stockPriceAtEntry).toBe('150.00');
    expect(record.fxRateUsed).toBeTruthy();
    expect(sharedSalaryDraftRepository.count()).toBe(0);
    expect(sharedSalaryRecordRepository.all()).toHaveLength(1);

    const employee = await request(app.getHttpServer())
      .get(`/employees/${employeeId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const employeeBody = employee.body as EmployeeResponseDto;
    expect(employeeBody.currentSalaryId).toBe(record.id);
    expect(employeeBody.currentSalary).toEqual({
      totalCompensation: record.totalCompensation,
      currency: record.currency,
    });

    const list = await request(app.getHttpServer())
      .get('/employees')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const listed = (list.body as { data: EmployeeResponseDto[] }).data.find(
      (row) => row.id === employeeId,
    );
    expect(listed?.currentSalary).toEqual({
      totalCompensation: record.totalCompensation,
      currency: record.currency,
    });
  });

  it('DELETE /salary-drafts/:id rollbacks draft without salary change', async () => {
    const draftResponse = await request(app.getHttpServer())
      .post(`/employees/${employeeId}/salary/draft`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(draftPayload)
      .expect(201);

    const draft = draftResponse.body as SalaryDraftResponseDto;

    await request(app.getHttpServer())
      .delete(`/salary-drafts/${draft.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    expect(sharedSalaryDraftRepository.count()).toBe(0);
    expect(sharedSalaryRecordRepository.all()).toHaveLength(0);

    const employee = await request(app.getHttpServer())
      .get(`/employees/${employeeId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const employeeBody = employee.body as EmployeeResponseDto;
    expect(employeeBody.currentSalaryId).toBeNull();
    expect(employeeBody.currentSalary).toBeNull();
  });
});
