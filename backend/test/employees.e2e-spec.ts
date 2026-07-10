import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { EmploymentType } from '../src/common/enums/employment-type.enum';
import { setupSwagger } from '../src/common/swagger/setup-swagger';
import { LoginResponseDto } from '../src/modules/auth/adapters/inbound/login-response.dto';
import { EmployeeResponseDto } from '../src/modules/employees/adapters/inbound/employee-response.dto';
import { PaginatedEmployeesDto } from '../src/modules/employees/adapters/inbound/paginated-employees.dto';
import {
  createTestModuleBuilder,
  sharedEmployeeRepository,
  sharedSettingsRepository,
} from './test-app.util';

describe('Employees (e2e)', () => {
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

  it('POST /employees creates an active employee', async () => {
    const response = await request(app.getHttpServer())
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

    const body = response.body as EmployeeResponseDto;
    expect(body.employeeId).toBe('E001');
    expect(body.status).toBe('Active');
    expect(body.currentSalaryId).toBeNull();
  });

  it('POST /employees rejects duplicate employeeId', async () => {
    await request(app.getHttpServer())
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

    await request(app.getHttpServer())
      .post('/employees')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        employeeId: 'E001',
        name: 'Other Person',
        email: 'other@example.com',
        country: 'India',
        employmentType: EmploymentType.Contract,
        joiningDate: '2026-02-01',
      })
      .expect(409);
  });

  it('POST /employees/:id/relieve moves employee to left list', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/employees')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        employeeId: 'E002',
        name: 'Grace Hopper',
        email: 'grace@example.com',
        country: 'US',
        employmentType: EmploymentType.Permanent,
        joiningDate: '2026-01-20',
      })
      .expect(201);

    const created = createResponse.body as EmployeeResponseDto;

    await request(app.getHttpServer())
      .post(`/employees/${created.id}/relieve`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ reason: 'Resigned' })
      .expect(200);

    const active = await request(app.getHttpServer())
      .get('/employees')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const left = await request(app.getHttpServer())
      .get('/employees/left')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect((active.body as PaginatedEmployeesDto).total).toBe(0);
    expect((left.body as PaginatedEmployeesDto).total).toBe(1);
    expect((left.body as PaginatedEmployeesDto).data[0]?.employeeId).toBe(
      'E002',
    );
  });

  it('GET /employees supports pagination metadata', async () => {
    for (let i = 1; i <= 3; i += 1) {
      await request(app.getHttpServer())
        .post('/employees')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          employeeId: `E10${i}`,
          name: `Employee ${i}`,
          email: `employee${i}@example.com`,
          country: 'India',
          employmentType: EmploymentType.Permanent,
          joiningDate: '2026-01-15',
        })
        .expect(201);
    }

    const response = await request(app.getHttpServer())
      .get('/employees?page=1&limit=2')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = response.body as PaginatedEmployeesDto;
    expect(body.data).toHaveLength(2);
    expect(body.total).toBe(3);
    expect(body.page).toBe(1);
    expect(body.limit).toBe(2);
    expect(body.totalPages).toBe(2);
  });

  it('GET /employees returns 401 without token', () => {
    return request(app.getHttpServer()).get('/employees').expect(401);
  });
});
