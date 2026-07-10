import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { EmploymentType } from '../src/common/enums/employment-type.enum';
import { PaymentCycle } from '../src/common/enums/payment-cycle.enum';
import { setupSwagger } from '../src/common/swagger/setup-swagger';
import { LoginResponseDto } from '../src/modules/auth/adapters/inbound/login-response.dto';
import { EmployeeResponseDto } from '../src/modules/employees/adapters/inbound/employee-response.dto';
import { MigrateFromTemplateResponseDto } from '../src/modules/salary/adapters/inbound/migrate-from-template-response.dto';
import { SalaryHistoryResponseDto } from '../src/modules/salary/adapters/inbound/salary-history-response.dto';
import { SalaryRecordResponseDto } from '../src/modules/salary/adapters/inbound/salary-record-response.dto';
import { TemplateResponseDto } from '../src/modules/salary-templates/adapters/inbound/template-response.dto';
import {
  createTestModuleBuilder,
  sharedCurrencyRateRepository,
  sharedEmployeeRepository,
  sharedSalaryDraftRepository,
  sharedSalaryRecordRepository,
  sharedSalaryTemplateRepository,
  sharedSettingsRepository,
} from './test-app.util';

describe('Salary history & migrate (e2e)', () => {
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
    sharedSalaryTemplateRepository.clear();
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

  async function commitSalary(payload: {
    baseSalary: number;
    effectiveDate: string;
    reason?: string;
    templateId?: string;
    components?: {
      allowances?: number;
      bonus?: number;
    };
  }): Promise<SalaryRecordResponseDto> {
    const draftResponse = await request(app.getHttpServer())
      .post(`/employees/${employeeId}/salary/draft`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        effectiveDate: payload.effectiveDate,
        baseSalary: payload.baseSalary,
        currency: 'INR',
        paymentCycle: PaymentCycle.Monthly,
        components: payload.components ?? { allowances: 10_000 },
        reason: payload.reason,
        templateId: payload.templateId,
      })
      .expect(201);

    const draftId = (draftResponse.body as { id: string }).id;

    const commitResponse = await request(app.getHttpServer())
      .post(`/salary-drafts/${draftId}/commit`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    return commitResponse.body as SalaryRecordResponseDto;
  }

  it('GET /employees/:id/salary/history returns append-only records', async () => {
    const first = await commitSalary({
      baseSalary: 1_000_000,
      effectiveDate: '2026-01-01',
      reason: 'Initial',
    });
    const second = await commitSalary({
      baseSalary: 1_100_000,
      effectiveDate: '2026-06-01',
      reason: 'Correction',
    });

    const historyResponse = await request(app.getHttpServer())
      .get(`/employees/${employeeId}/salary/history`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const history = historyResponse.body as SalaryHistoryResponseDto;
    expect(history.total).toBe(2);
    expect(history.data.map((row) => row.id)).toEqual([second.id, first.id]);
    expect(history.data[0]?.reason).toBe('Correction');
    expect(history.data[1]?.baseSalary).toBe('1000000.00');
  });

  it('POST /salary-templates/:id/migrate preserves baseSalary', async () => {
    const v1Response = await request(app.getHttpServer())
      .post('/salary-templates')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'India Standard',
        country: 'India',
        currency: 'INR',
        components: {
          basePay: 1_000_000,
          allowances: 10_000,
          bonus: 20_000,
        },
      })
      .expect(201);

    const v1 = v1Response.body as TemplateResponseDto;

    await commitSalary({
      baseSalary: 1_000_000,
      effectiveDate: '2026-01-01',
      templateId: v1.id,
      components: { allowances: 10_000, bonus: 20_000 },
    });

    const v2Response = await request(app.getHttpServer())
      .post(`/salary-templates/${v1.id}/versions`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'India Standard',
        country: 'India',
        currency: 'INR',
        components: {
          basePay: 1_400_000,
          allowances: 60_000,
          bonus: 120_000,
        },
      })
      .expect(201);

    const v2 = v2Response.body as TemplateResponseDto;

    const migrateResponse = await request(app.getHttpServer())
      .post(`/salary-templates/${v2.id}/migrate`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        employeeIds: [employeeId],
        preserveFields: ['baseSalary'],
        effectiveDate: '2026-07-01',
        reason: 'Migrate to v2',
      })
      .expect(201);

    const migrated = migrateResponse.body as MigrateFromTemplateResponseDto;
    expect(migrated.draftsCreated).toBe(1);
    expect(migrated.drafts[0]?.baseSalary).toBe('1000000.00');
    expect(migrated.drafts[0]?.components.allowances).toBe(60_000);
    expect(migrated.drafts[0]?.components.bonus).toBe(120_000);
    expect(migrated.drafts[0]?.templateId).toBe(v2.id);
    expect(sharedSalaryDraftRepository.count()).toBe(1);
  });
});
