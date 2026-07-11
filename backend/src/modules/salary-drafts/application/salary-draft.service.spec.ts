import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CurrencyService } from '../../../common/currency/currency.service';
import { EmployeeStatus } from '../../../common/enums/employee-status.enum';
import { EmploymentType } from '../../../common/enums/employment-type.enum';
import { PaymentCycle } from '../../../common/enums/payment-cycle.enum';
import { EmployeeService } from '../../employees/application/employee.service';
import { EMPLOYEE_REPOSITORY } from '../../employees/ports/outbound/employee.repository.port';
import type { Employee } from '../../employees/domain/employee.model';
import { SettingsService } from '../../settings/application/settings.service';
import { DEFAULT_SETTINGS } from '../../settings/domain/default-settings';
import { SalaryTemplateService } from '../../salary-templates/application/salary-template.service';
import { SALARY_RECORD_REPOSITORY } from '../../salary/ports/outbound/salary-record.repository.port';
import type { SalaryDraft } from '../domain/salary-draft.model';
import { SALARY_DRAFT_REPOSITORY } from '../ports/outbound/salary-draft.repository.port';
import { SalaryDraftService } from './salary-draft.service';
import { StockSnapshotService } from './stock-snapshot.service';
import { DashboardSnapshotService } from '../../dashboard/application/dashboard-snapshot.service';

describe('SalaryDraftService', () => {
  let service: SalaryDraftService;
  let findByEmployeeIdMock: jest.Mock;
  let saveDraftMock: jest.Mock;
  let updateDraftMock: jest.Mock;
  let deleteDraftMock: jest.Mock;
  let findDraftByIdMock: jest.Mock;
  let saveRecordMock: jest.Mock;
  let updateEmployeeMock: jest.Mock;
  let findEmployeeMock: jest.Mock;
  let captureMock: jest.Mock;
  let markAssignedMock: jest.Mock;
  let onSalaryCommittedMock: jest.Mock;

  const employee: Employee = {
    id: 'emp-1',
    employeeId: 'E001',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    country: 'India',
    employmentType: EmploymentType.Permanent,
    status: EmployeeStatus.Active,
    joiningDate: '2026-01-15',
    currentSalaryId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const draftBase: SalaryDraft = {
    id: 'draft-1',
    employeeId: 'emp-1',
    templateId: null,
    effectiveDate: '2026-04-01',
    baseSalary: '1200000.00',
    currency: 'INR',
    paymentCycle: PaymentCycle.Monthly,
    components: { allowances: 50_000 },
    stockPriceAtEntry: null,
    stockPriceCurrencyAtEntry: null,
    stockValueInStockCurrency: null,
    stockValueInSalaryCurrency: null,
    fxRateUsed: null,
    reason: null,
    createdBy: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    findByEmployeeIdMock = jest.fn().mockResolvedValue(null);
    saveDraftMock = jest.fn().mockImplementation((d) => Promise.resolve(d));
    updateDraftMock = jest.fn().mockImplementation((d) => Promise.resolve(d));
    deleteDraftMock = jest.fn().mockResolvedValue(undefined);
    findDraftByIdMock = jest.fn();
    saveRecordMock = jest.fn().mockImplementation((r) => Promise.resolve(r));
    updateEmployeeMock = jest
      .fn()
      .mockImplementation((e) => Promise.resolve(e));
    findEmployeeMock = jest.fn().mockResolvedValue(employee);
    captureMock = jest.fn().mockResolvedValue({
      stockPriceAtEntry: null,
      stockPriceCurrencyAtEntry: null,
      stockValueInStockCurrency: null,
      stockValueInSalaryCurrency: null,
      fxRateUsed: null,
    });
    markAssignedMock = jest.fn().mockResolvedValue({});
    onSalaryCommittedMock = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalaryDraftService,
        {
          provide: SALARY_DRAFT_REPOSITORY,
          useValue: {
            findById: findDraftByIdMock,
            findListItemById: jest.fn(),
            findByEmployeeId: findByEmployeeIdMock,
            findMany: jest.fn(),
            save: saveDraftMock,
            update: updateDraftMock,
            delete: deleteDraftMock,
          },
        },
        {
          provide: SALARY_RECORD_REPOSITORY,
          useValue: { findById: jest.fn(), save: saveRecordMock },
        },
        {
          provide: EMPLOYEE_REPOSITORY,
          useValue: {
            findById: jest.fn(),
            update: updateEmployeeMock,
          },
        },
        {
          provide: EmployeeService,
          useValue: { findOne: findEmployeeMock },
        },
        {
          provide: SettingsService,
          useValue: {
            getCurrencies: jest
              .fn()
              .mockResolvedValue(DEFAULT_SETTINGS.supportedCurrencies),
          },
        },
        {
          provide: StockSnapshotService,
          useValue: { capture: captureMock },
        },
        {
          provide: SalaryTemplateService,
          useValue: {
            findOne: jest.fn().mockResolvedValue({ id: 'tpl-1' }),
            markAssigned: markAssignedMock,
          },
        },
        {
          provide: CurrencyService,
          useValue: {},
        },
        {
          provide: DashboardSnapshotService,
          useValue: { onSalaryCommitted: onSalaryCommittedMock },
        },
      ],
    }).compile();

    service = module.get(SalaryDraftService);
  });

  it('creates a draft when none exists', async () => {
    const draft = await service.upsert(
      'emp-1',
      {
        effectiveDate: '2026-04-01',
        baseSalary: 1_200_000,
        currency: 'INR',
        paymentCycle: PaymentCycle.Monthly,
        components: { allowances: 50_000 },
      },
      'admin',
    );

    expect(saveDraftMock).toHaveBeenCalled();
    expect(updateDraftMock).not.toHaveBeenCalled();
    expect(draft.employeeId).toBe('emp-1');
    expect(draft.baseSalary).toBe('1200000.00');
    expect(draft.employee).toEqual({
      employeeId: 'E001',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    });
  });

  it('upserts existing draft for the same employee', async () => {
    findByEmployeeIdMock.mockResolvedValue(draftBase);

    const draft = await service.upsert(
      'emp-1',
      {
        effectiveDate: '2026-05-01',
        baseSalary: 1_300_000,
        currency: 'INR',
        paymentCycle: PaymentCycle.Monthly,
      },
      'admin',
    );

    expect(updateDraftMock).toHaveBeenCalled();
    expect(saveDraftMock).not.toHaveBeenCalled();
    expect(draft.baseSalary).toBe('1300000.00');
    expect(draft.id).toBe('draft-1');
    expect(draft.employee.employeeId).toBe('E001');
  });

  it('commits draft into a salary record and clears draft', async () => {
    findDraftByIdMock.mockResolvedValue(draftBase);

    const record = await service.commit('draft-1', 'admin');

    expect(saveRecordMock).toHaveBeenCalled();
    expect(updateEmployeeMock).toHaveBeenCalledWith(
      expect.objectContaining({ currentSalaryId: record.id }),
    );
    expect(deleteDraftMock).toHaveBeenCalledWith('draft-1');
    expect(record.totalCompensation).toBe('1250000.00');
    expect(onSalaryCommittedMock).toHaveBeenCalledWith(
      expect.objectContaining({
        country: 'India',
        effectiveDate: '2026-04-01',
        newCurrency: 'INR',
        newTotalCompensation: '1250000.00',
      }),
    );
  });

  it('marks template assigned on commit when templateId set', async () => {
    findDraftByIdMock.mockResolvedValue({
      ...draftBase,
      templateId: 'tpl-1',
    });

    await service.commit('draft-1', 'admin');

    expect(markAssignedMock).toHaveBeenCalledWith('tpl-1');
  });

  it('rollback deletes draft without touching salary', async () => {
    findDraftByIdMock.mockResolvedValue(draftBase);

    await service.rollback('draft-1');

    expect(deleteDraftMock).toHaveBeenCalledWith('draft-1');
    expect(saveRecordMock).not.toHaveBeenCalled();
  });

  it('rejects upsert for missing employee', async () => {
    findEmployeeMock.mockRejectedValue(new NotFoundException());

    await expect(
      service.upsert(
        'missing',
        {
          effectiveDate: '2026-04-01',
          baseSalary: 1,
          currency: 'INR',
          paymentCycle: PaymentCycle.Monthly,
        },
        'admin',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects commit for Left employee', async () => {
    findDraftByIdMock.mockResolvedValue(draftBase);
    findEmployeeMock.mockResolvedValue({
      ...employee,
      status: EmployeeStatus.Left,
    });

    await expect(service.commit('draft-1', 'admin')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
