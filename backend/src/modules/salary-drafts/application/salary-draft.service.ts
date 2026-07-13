import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { EmployeeStatus } from '../../../common/enums/employee-status.enum';
import { getPaginationMeta } from '../../../common/pagination/pagination.utils';
import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';
import { EmployeeService } from '../../employees/application/employee.service';
import {
  EMPLOYEE_REPOSITORY,
  type EmployeeRepositoryPort,
} from '../../employees/ports/outbound/employee.repository.port';
import { SettingsService } from '../../settings/application/settings.service';
import { SalaryTemplateService } from '../../salary-templates/application/salary-template.service';
import { toMoneyString } from '../../salary/application/compute-total-compensation';
import type { SalaryComponents } from '../../salary/domain/salary-components';
import {
  SALARY_RECORD_REPOSITORY,
  type SalaryRecordRepositoryPort,
} from '../../salary/ports/outbound/salary-record.repository.port';
import type { Employee } from '../../employees/domain/employee.model';
import { UpsertSalaryDraftDto } from '../adapters/inbound/upsert-salary-draft.dto';
import { SalaryDraftListResponseDto } from '../adapters/inbound/salary-draft-list-response.dto';
import { SalaryDraftResponseDto } from '../adapters/inbound/salary-draft-response.dto';
import type { SalaryDraft } from '../domain/salary-draft.model';
import {
  SALARY_DRAFT_REPOSITORY,
  type SalaryDraftRepositoryPort,
} from '../ports/outbound/salary-draft.repository.port';
import { createSalaryRecordFromDraft } from './salary-record.factory';
import {
  toDraftEmployeeSummary,
  toSalaryDraftListResponseDto,
  toSalaryDraftResponseDto,
} from './salary-draft.mapper';
import { toSalaryRecordResponseDto } from '../../salary/application/salary-record.mapper';
import { StockSnapshotService } from './stock-snapshot.service';
import { DashboardSnapshotService } from '../../dashboard/application/dashboard-snapshot.service';

@Injectable()
export class SalaryDraftService {
  constructor(
    @Inject(SALARY_DRAFT_REPOSITORY)
    private readonly draftRepository: SalaryDraftRepositoryPort,
    @Inject(SALARY_RECORD_REPOSITORY)
    private readonly recordRepository: SalaryRecordRepositoryPort,
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly employeeRepository: EmployeeRepositoryPort,
    private readonly employeeService: EmployeeService,
    private readonly settingsService: SettingsService,
    private readonly stockSnapshotService: StockSnapshotService,
    private readonly salaryTemplateService: SalaryTemplateService,
    private readonly dashboardSnapshotService: DashboardSnapshotService,
  ) {}

  async findAll(
    query: PaginationQueryDto,
  ): Promise<SalaryDraftListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const result = await this.draftRepository.findMany({
      page,
      limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
    const meta = getPaginationMeta(result.total, page, limit);

    return {
      data: result.data.map(toSalaryDraftListResponseDto),
      ...meta,
    };
  }

  async findOne(id: string): Promise<SalaryDraft> {
    const draft = await this.draftRepository.findById(id);
    if (!draft) {
      throw new NotFoundException(`Salary draft ${id} not found`);
    }
    return draft;
  }

  async findOneResponse(id: string): Promise<SalaryDraftResponseDto> {
    const item = await this.draftRepository.findListItemById(id);
    if (!item) {
      throw new NotFoundException(`Salary draft ${id} not found`);
    }
    return toSalaryDraftListResponseDto(item);
  }

  async upsert(
    employeeId: string,
    dto: UpsertSalaryDraftDto,
    createdBy: string,
  ): Promise<SalaryDraftResponseDto> {
    const employee = await this.employeeService.findOne(employeeId);
    if (employee.status !== EmployeeStatus.Active) {
      throw new BadRequestException(
        `Cannot create salary draft for Left employee ${employeeId}`,
      );
    }

    await this.assertSupportedCurrency(dto.currency);

    if (dto.templateId) {
      await this.salaryTemplateService.findOne(dto.templateId);
    }

    const components = this.normalizeComponents(dto.components);
    const snapshot = await this.stockSnapshotService.capture(
      components.stock,
      dto.currency,
    );

    const existing = await this.draftRepository.findByEmployeeId(employeeId);
    const now = new Date();
    const employeeSummary = toDraftEmployeeSummary(employee);

    if (existing) {
      const updated: SalaryDraft = {
        ...existing,
        templateId: dto.templateId ?? null,
        effectiveDate: dto.effectiveDate,
        baseSalary: toMoneyString(dto.baseSalary),
        currency: dto.currency.toUpperCase(),
        paymentCycle: dto.paymentCycle,
        components,
        ...snapshot,
        reason: dto.reason ?? null,
        createdBy,
        updatedAt: now,
      };
      const saved = await this.draftRepository.update(updated);
      return toSalaryDraftResponseDto(saved, employeeSummary);
    }

    const draft: SalaryDraft = {
      id: randomUUID(),
      employeeId,
      templateId: dto.templateId ?? null,
      effectiveDate: dto.effectiveDate,
      baseSalary: toMoneyString(dto.baseSalary),
      currency: dto.currency.toUpperCase(),
      paymentCycle: dto.paymentCycle,
      components,
      ...snapshot,
      reason: dto.reason ?? null,
      createdBy,
      createdAt: now,
      updatedAt: now,
    };

    const saved = await this.draftRepository.save(draft);
    return toSalaryDraftResponseDto(saved, employeeSummary);
  }

  async bulkUpsert(
    items: Array<{ employee: Employee; dto: UpsertSalaryDraftDto }>,
    createdBy: string,
  ): Promise<SalaryDraftResponseDto[]> {
    if (items.length === 0) {
      throw new BadRequestException('At least one employee is required');
    }

    const supportedCurrencies = await this.settingsService.getCurrencies();
    for (const { dto } of items) {
      const normalized = dto.currency.toUpperCase();
      if (!supportedCurrencies.includes(normalized)) {
        throw new BadRequestException(
          `Currency ${normalized} is not in supported currencies`,
        );
      }
    }

    const employeeIds = items.map((item) => item.employee.id);
    const existingDrafts =
      await this.draftRepository.findByEmployeeIds(employeeIds);
    const existingByEmployeeId = new Map(
      existingDrafts.map((draft) => [draft.employeeId, draft]),
    );

    const now = new Date();
    const draftsToPersist: SalaryDraft[] = [];

    for (const { employee, dto } of items) {
      const components = this.normalizeComponents(dto.components);
      const snapshot = await this.stockSnapshotService.capture(
        components.stock,
        dto.currency,
      );
      const existing = existingByEmployeeId.get(employee.id);

      if (existing) {
        draftsToPersist.push({
          ...existing,
          templateId: dto.templateId ?? null,
          effectiveDate: dto.effectiveDate,
          baseSalary: toMoneyString(dto.baseSalary),
          currency: dto.currency.toUpperCase(),
          paymentCycle: dto.paymentCycle,
          components,
          ...snapshot,
          reason: dto.reason ?? null,
          createdBy,
          updatedAt: now,
        });
      } else {
        draftsToPersist.push({
          id: randomUUID(),
          employeeId: employee.id,
          templateId: dto.templateId ?? null,
          effectiveDate: dto.effectiveDate,
          baseSalary: toMoneyString(dto.baseSalary),
          currency: dto.currency.toUpperCase(),
          paymentCycle: dto.paymentCycle,
          components,
          ...snapshot,
          reason: dto.reason ?? null,
          createdBy,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    const saved = await this.draftRepository.saveMany(draftsToPersist);

    return saved.map((draft) => {
      const employee = items.find((item) => item.employee.id === draft.employeeId)
        ?.employee;
      if (!employee) {
        throw new BadRequestException(
          `Missing employee context for draft ${draft.id}`,
        );
      }
      return toSalaryDraftResponseDto(draft, toDraftEmployeeSummary(employee));
    });
  }

  async commit(id: string, createdBy: string) {
    const draft = await this.findOne(id);
    const employee = await this.employeeService.findOne(draft.employeeId);

    if (employee.status !== EmployeeStatus.Active) {
      throw new BadRequestException(
        `Cannot commit draft for Left employee ${draft.employeeId}`,
      );
    }

    let previousCurrency: string | null = null;
    let previousTotalCompensation: string | null = null;
    if (employee.currentSalaryId) {
      const previous = await this.recordRepository.findById(
        employee.currentSalaryId,
      );
      if (previous) {
        previousCurrency = previous.currency;
        previousTotalCompensation = previous.totalCompensation;
      }
    }

    const record = createSalaryRecordFromDraft(draft, createdBy);
    const savedRecord = await this.recordRepository.save(record);

    await this.employeeRepository.update({
      ...employee,
      currentSalaryId: savedRecord.id,
      updatedAt: new Date(),
    });

    if (draft.templateId) {
      await this.salaryTemplateService.markAssigned(draft.templateId);
    }

    await this.draftRepository.delete(draft.id);

    await this.dashboardSnapshotService.onSalaryCommitted({
      country: employee.country,
      effectiveDate: savedRecord.effectiveDate,
      newCurrency: savedRecord.currency,
      newTotalCompensation: savedRecord.totalCompensation,
      previousCurrency,
      previousTotalCompensation,
    });

    return toSalaryRecordResponseDto(savedRecord);
  }

  async rollback(id: string): Promise<void> {
    const draft = await this.findOne(id);
    await this.draftRepository.delete(draft.id);
  }

  private async assertSupportedCurrency(currency: string): Promise<void> {
    const currencies = await this.settingsService.getCurrencies();
    const normalized = currency.toUpperCase();
    if (!currencies.includes(normalized)) {
      throw new BadRequestException(
        `Currency ${normalized} is not in supported currencies`,
      );
    }
  }

  private normalizeComponents(
    components?: UpsertSalaryDraftDto['components'],
  ): SalaryComponents {
    if (!components) {
      return {};
    }

    return {
      ...(components.allowances !== undefined
        ? { allowances: components.allowances }
        : {}),
      ...(components.bonus !== undefined ? { bonus: components.bonus } : {}),
      ...(components.stock
        ? {
            stock: {
              quantity: components.stock.quantity,
              ...(components.stock.vestingDate
                ? { vestingDate: components.stock.vestingDate }
                : {}),
            },
          }
        : {}),
    };
  }
}
