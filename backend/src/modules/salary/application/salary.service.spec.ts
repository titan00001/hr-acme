import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EmployeeStatus } from '../../../common/enums/employee-status.enum';
import { EmploymentType } from '../../../common/enums/employment-type.enum';
import { PaymentCycle } from '../../../common/enums/payment-cycle.enum';
import { EmployeeService } from '../../employees/application/employee.service';
import type { Employee } from '../../employees/domain/employee.model';
import { SalaryDraftService } from '../../salary-drafts/application/salary-draft.service';
import type { SalaryDraftResponseDto } from '../../salary-drafts/adapters/inbound/salary-draft-response.dto';
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
  let findByIdsMock: jest.Mock;
  let findMigrationCandidatesMock: jest.Mock;
  let findEmployeeMock: jest.Mock;
  let findEmployeesByIdsMock: jest.Mock;
  let findTemplateMock: jest.Mock;
  let findAllByNameMock: jest.Mock;
  let bulkUpsertMock: jest.Mock;

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

  function draftResponse(
    dto: UpsertSalaryDraftDto,
  ): SalaryDraftResponseDto {
    return {
      id: 'draft-1',
      employeeId: 'emp-1',
      employee: {
        employeeId: 'E001',
        name: 'Ada',
        email: 'ada@example.com',
      },
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  beforeEach(async () => {
    findByEmployeeIdMock = jest.fn().mockResolvedValue({
      data: [currentRecord],
      total: 1,
    });
    findByIdMock = jest.fn().mockResolvedValue(currentRecord);
    findByIdsMock = jest.fn().mockResolvedValue([currentRecord]);
    findMigrationCandidatesMock = jest.fn().mockResolvedValue({
      data: [
        {
          id: 'emp-1',
          employeeId: 'E001',
          name: 'Ada',
          email: 'ada@example.com',
          country: 'India',
          currentTemplateId: 'tpl-v1',
          currentTemplateVersion: 1,
          currentSalary: {
            totalCompensation: '1030000.00',
            currency: 'INR',
          },
        },
      ],
      total: 1,
    });
    findEmployeeMock = jest.fn().mockResolvedValue(employee);
    findEmployeesByIdsMock = jest.fn().mockResolvedValue([employee]);
    findTemplateMock = jest.fn().mockResolvedValue(templateV2);
    findAllByNameMock = jest.fn().mockResolvedValue([
      { ...templateV2, id: 'tpl-v1', version: 1 },
      templateV2,
    ]);
    bulkUpsertMock = jest.fn(
      (
        items: Array<{ employee: Employee; dto: UpsertSalaryDraftDto }>,
        createdBy: string,
      ) =>
        Promise.resolve(
          items.map((item) => draftResponse({ ...item.dto, reason: item.dto.reason })),
        ),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalaryService,
        {
          provide: SALARY_RECORD_REPOSITORY,
          useValue: {
            findById: findByIdMock,
            findByIds: findByIdsMock,
            findByEmployeeId: findByEmployeeIdMock,
            findMigrationCandidates: findMigrationCandidatesMock,
            save: jest.fn(),
          },
        },
        {
          provide: EmployeeService,
          useValue: {
            findOne: findEmployeeMock,
            findByIds: findEmployeesByIdsMock,
          },
        },
        {
          provide: SalaryTemplateService,
          useValue: {
            findOne: findTemplateMock,
            findAllByName: findAllByNameMock,
          },
        },
        {
          provide: SalaryDraftService,
          useValue: { bulkUpsert: bulkUpsertMock },
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

  it('lists migration candidates from sibling template versions', async () => {
    const result = await service.listMigrationCandidates('tpl-v2', {
      page: 1,
      limit: 20,
    });

    expect(result.total).toBe(1);
    expect(result.data[0]?.id).toBe('emp-1');
    expect(findMigrationCandidatesMock).toHaveBeenCalledWith(['tpl-v1'], {
      page: 1,
      limit: 20,
    });
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
    expect(findEmployeesByIdsMock).toHaveBeenCalledWith(['emp-1']);
    expect(findByIdsMock).toHaveBeenCalledWith(['rec-1']);
    expect(bulkUpsertMock).toHaveBeenCalledTimes(1);
    const bulkArgs = bulkUpsertMock.mock.calls[0];
    expect(bulkArgs?.[0]).toHaveLength(1);
    expect(bulkArgs?.[0][0]?.employee.id).toBe('emp-1');
    expect(bulkArgs?.[0][0]?.dto.baseSalary).toBe(1_000_000);
    expect(bulkArgs?.[0][0]?.dto.components?.allowances).toBe(60_000);
    expect(bulkArgs?.[0][0]?.dto.components?.bonus).toBe(120_000);
    expect(bulkArgs?.[0][0]?.dto.templateId).toBe('tpl-v2');
    expect(bulkArgs?.[1]).toBe('admin');
  });

  it('rejects migrate for Left employee', async () => {
    findEmployeesByIdsMock.mockResolvedValue([
      {
        ...employee,
        status: EmployeeStatus.Left,
      },
    ]);

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
    expect(bulkUpsertMock).not.toHaveBeenCalled();
  });

  it('rejects migrate when employee is not on a sibling template version', async () => {
    findByIdsMock.mockResolvedValue([
      { ...currentRecord, templateId: 'other-template' },
    ]);

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
    expect(bulkUpsertMock).not.toHaveBeenCalled();
  });

  it('rejects history for missing employee', async () => {
    findEmployeeMock.mockRejectedValue(new NotFoundException());
    await expect(
      service.getHistory('missing', { page: 1, limit: 20 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
