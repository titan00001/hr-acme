import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeStatus } from '../../../common/enums/employee-status.enum';
import { EmploymentType } from '../../../common/enums/employment-type.enum';
import { SettingsService } from '../../settings/application/settings.service';
import { DEFAULT_SETTINGS } from '../../settings/domain/default-settings';
import type { Employee } from '../domain/employee.model';
import {
  EMPLOYEE_REPOSITORY,
  type EmployeeRepositoryPort,
} from '../ports/outbound/employee.repository.port';
import { EmployeeService } from './employee.service';

describe('EmployeeService', () => {
  let service: EmployeeService;
  let findByIdMock: jest.MockedFunction<EmployeeRepositoryPort['findById']>;
  let findByEmployeeIdMock: jest.MockedFunction<
    EmployeeRepositoryPort['findByEmployeeId']
  >;
  let findByEmailMock: jest.MockedFunction<
    EmployeeRepositoryPort['findByEmail']
  >;
  let findManyMock: jest.MockedFunction<EmployeeRepositoryPort['findMany']>;
  let saveMock: jest.MockedFunction<EmployeeRepositoryPort['save']>;
  let updateMock: jest.MockedFunction<EmployeeRepositoryPort['update']>;
  let getCountriesMock: jest.MockedFunction<SettingsService['getCountries']>;

  const sampleEmployee: Employee = {
    id: 'emp-1',
    employeeId: 'E001',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    country: 'India',
    employmentType: EmploymentType.Permanent,
    status: EmployeeStatus.Active,
    joiningDate: '2026-01-15',
    currentSalaryId: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    findByIdMock = jest.fn() as jest.MockedFunction<
      EmployeeRepositoryPort['findById']
    >;
    findByEmployeeIdMock = jest.fn() as jest.MockedFunction<
      EmployeeRepositoryPort['findByEmployeeId']
    >;
    findByEmailMock = jest.fn() as jest.MockedFunction<
      EmployeeRepositoryPort['findByEmail']
    >;
    findManyMock = jest.fn() as jest.MockedFunction<
      EmployeeRepositoryPort['findMany']
    >;
    saveMock = jest.fn() as jest.MockedFunction<EmployeeRepositoryPort['save']>;
    updateMock = jest.fn() as jest.MockedFunction<
      EmployeeRepositoryPort['update']
    >;
    getCountriesMock = jest.fn() as jest.MockedFunction<
      SettingsService['getCountries']
    >;

    getCountriesMock.mockResolvedValue(DEFAULT_SETTINGS.supportedCountries);
    findByEmployeeIdMock.mockResolvedValue(null);
    findByEmailMock.mockResolvedValue(null);
    saveMock.mockImplementation((employee) => Promise.resolve(employee));
    updateMock.mockImplementation((employee) => Promise.resolve(employee));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeService,
        {
          provide: EMPLOYEE_REPOSITORY,
          useValue: {
            findById: findByIdMock,
            findByEmployeeId: findByEmployeeIdMock,
            findByEmail: findByEmailMock,
            findMany: findManyMock,
            save: saveMock,
            update: updateMock,
          },
        },
        {
          provide: SettingsService,
          useValue: { getCountries: getCountriesMock },
        },
      ],
    }).compile();

    service = module.get<EmployeeService>(EmployeeService);
  });

  it('creates an active employee when country is supported', async () => {
    const created = await service.create({
      employeeId: 'E001',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      country: 'India',
      employmentType: EmploymentType.Permanent,
      joiningDate: '2026-01-15',
    });

    expect(created.status).toBe(EmployeeStatus.Active);
    expect(created.currentSalaryId).toBeNull();
    expect(saveMock).toHaveBeenCalled();
  });

  it('rejects unsupported country', async () => {
    await expect(
      service.create({
        employeeId: 'E002',
        name: 'Grace Hopper',
        email: 'grace@example.com',
        country: 'Mars',
        employmentType: EmploymentType.Contract,
        joiningDate: '2026-02-01',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects duplicate employeeId', async () => {
    findByEmployeeIdMock.mockResolvedValue(sampleEmployee);

    await expect(
      service.create({
        employeeId: 'E001',
        name: 'Other',
        email: 'other@example.com',
        country: 'India',
        employmentType: EmploymentType.Permanent,
        joiningDate: '2026-01-15',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('relieves an active employee', async () => {
    findByIdMock.mockResolvedValue(sampleEmployee);

    const relieved = await service.relieve('emp-1');

    expect(relieved.status).toBe(EmployeeStatus.Left);
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ status: EmployeeStatus.Left }),
    );
  });

  it('throws when employee is missing', async () => {
    findByIdMock.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('lists active employees by default', async () => {
    findManyMock.mockResolvedValue({ data: [sampleEmployee], total: 1 });

    const result = await service.findAll({
      page: 1,
      limit: 20,
      sortOrder: 'ASC',
    });

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ status: EmployeeStatus.Active }),
    );
    expect(result.total).toBe(1);
    expect(result.data[0]?.employeeId).toBe('E001');
  });
});
