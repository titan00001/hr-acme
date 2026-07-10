import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeStatus } from '../../../common/enums/employee-status.enum';
import { EmploymentType } from '../../../common/enums/employment-type.enum';
import { PaymentCycle } from '../../../common/enums/payment-cycle.enum';
import { EmployeeService } from '../../employees/application/employee.service';
import type { Employee } from '../../employees/domain/employee.model';
import { SalaryDraftService } from '../../salary-drafts/application/salary-draft.service';
import type { SalaryDraft } from '../../salary-drafts/domain/salary-draft.model';
import type { UpsertSalaryDraftDto } from '../../salary-drafts/adapters/inbound/upsert-salary-draft.dto';
import { SalaryTemplateService } from '../../salary-templates/application/salary-template.service';
import type { SalaryTemplate } from '../../salary-templates/domain/salary-template.model';
import type { SalaryRecord } from '../domain/salary-record.model';
import { SALARY_RECORD_REPOSITORY } from '../ports/outbound/salary-record.repository.port';
import { SalaryService } from './salary.service';

describe('SalaryService', () => {
  let service: SalaryService;
  let findByEmployeeIdMock: jest.Mock;
  let findByIdMock: jest.Mock;
  let findEmployeeMock: jest.Mock;
  let findTemplateMock: jest.Mock;
  let upsertDraftMock: jest.MockedFunction<
    (
      employeeId: string,
      dto: UpsertSalaryDraftDto,
      createdBy: string,
    ) => Promise<SalaryDraft>
  >;

  const employee: Employee = {
    id: 'emp-1',
    employeeId: 'E001',
    name: 'Ada',
    email: 'ada@example.com',
    country: 'India',
    employmentType: EmploymentType.Permanent,
    status: EmployeeStatus.Active,
    joiningDate: '2026-01-15',
    currentSalaryId: 'rec-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const currentRecord: SalaryRecord = {
    id: 'rec-1',
    employeeId: 'emp-1',
    templateId: 'tpl-v1',
    effectiveDate: '2026-01-01',
    baseSalary: '1000000.00',
    currency: 'INR',
    paymentCycle: PaymentCycle.Monthly,
    components: { allowances: 10_000, bonus: 20_000 },
    totalCompensation: '1030000.00',
    stockPriceAtEntry: null,
    stockPriceCurrencyAtEntry: null,
    stockValueInStockCurrency: null,
    stockValueInSalaryCurrency: null,
    fxRateUsed: null,
    reason: null,
    createdBy: 'admin',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  const templateV2: SalaryTemplate = {
    id: 'tpl-v2',
    name: 'India Standard',
    version: 2,
    country: 'India',
    currency: 'INR',
    components: {
      basePay: 1_400_000,
      allowances: 60_000,
      bonus: 120_000,
    },
    isAssigned: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    findByEmployeeIdMock = jest.fn().mockResolvedValue({
      data: [currentRecord],
      total: 1,
    });
    findByIdMock = jest.fn().mockResolvedValue(currentRecord);
    findEmployeeMock = jest.fn().mockResolvedValue(employee);
    findTemplateMock = jest.fn().mockResolvedValue(templateV2);
    upsertDraftMock = jest.fn(
      (_employeeId: string, dto: UpsertSalaryDraftDto): Promise<SalaryDraft> =>
        Promise.resolve({
          id: 'draft-1',
          employeeId: 'emp-1',
          templateId: dto.templateId ?? null,
          effectiveDate: dto.effectiveDate,
          baseSalary: dto.baseSalary.toFixed(2),
          currency: dto.currency,
          paymentCycle: dto.paymentCycle,
          components: dto.components ?? {},
          stockPriceAtEntry: null,
          stockPriceCurrencyAtEntry: null,
          stockValueInStockCurrency: null,
          stockValueInSalaryCurrency: null,
          fxRateUsed: null,
          reason: dto.reason ?? null,
          createdBy: 'admin',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalaryService,
        {
          provide: SALARY_RECORD_REPOSITORY,
          useValue: {
            findById: findByIdMock,
            findByEmployeeId: findByEmployeeIdMock,
            save: jest.fn(),
          },
        },
        {
          provide: EmployeeService,
          useValue: { findOne: findEmployeeMock },
        },
        {
          provide: SalaryTemplateService,
          useValue: { findOne: findTemplateMock },
        },
        {
          provide: SalaryDraftService,
          useValue: { upsert: upsertDraftMock },
        },
      ],
    }).compile();

    service = module.get(SalaryService);
  });

  it('returns paginated history ordered by repository', async () => {
    const history = await service.getHistory('emp-1', { page: 1, limit: 20 });
    expect(history.total).toBe(1);
    expect(history.data[0]?.id).toBe('rec-1');
    expect(findEmployeeMock).toHaveBeenCalledWith('emp-1');
  });

  it('migrates with preserveFields keeping baseSalary', async () => {
    const result = await service.migrateFromTemplate(
      'tpl-v2',
      {
        employeeIds: ['emp-1'],
        preserveFields: ['baseSalary'],
        effectiveDate: '2026-07-01',
      },
      'admin',
    );

    expect(result.draftsCreated).toBe(1);
    expect(upsertDraftMock).toHaveBeenCalledTimes(1);
    const upsertArgs = upsertDraftMock.mock.calls[0];
    expect(upsertArgs?.[0]).toBe('emp-1');
    expect(upsertArgs?.[1].baseSalary).toBe(1_000_000);
    expect(upsertArgs?.[1].components?.allowances).toBe(60_000);
    expect(upsertArgs?.[1].components?.bonus).toBe(120_000);
    expect(upsertArgs?.[1].templateId).toBe('tpl-v2');
    expect(upsertArgs?.[2]).toBe('admin');
  });

  it('rejects migrate for Left employee', async () => {
    findEmployeeMock.mockResolvedValue({
      ...employee,
      status: EmployeeStatus.Left,
    });

    await expect(
      service.migrateFromTemplate(
        'tpl-v2',
        {
          employeeIds: ['emp-1'],
          preserveFields: [],
          effectiveDate: '2026-07-01',
        },
        'admin',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects history for missing employee', async () => {
    findEmployeeMock.mockRejectedValue(new NotFoundException());
    await expect(
      service.getHistory('missing', { page: 1, limit: 20 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
