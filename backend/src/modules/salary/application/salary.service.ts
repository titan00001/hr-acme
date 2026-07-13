import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import { getPaginationMeta } from '../../../common/pagination/pagination.utils';
import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';
import { EmployeeStatus } from '../../../common/enums/employee-status.enum';
import { PaymentCycle } from '../../../common/enums/payment-cycle.enum';
import { EmployeeService } from '../../employees/application/employee.service';
import { SalaryDraftService } from '../../salary-drafts/application/salary-draft.service';
import { UpsertSalaryDraftDto } from '../../salary-drafts/adapters/inbound/upsert-salary-draft.dto';
import { SalaryTemplateService } from '../../salary-templates/application/salary-template.service';
import type { SalaryTemplate } from '../../salary-templates/domain/salary-template.model';
import { MigrateFromTemplateDto } from '../adapters/inbound/migrate-from-template.dto';
import { MigrateFromTemplateResponseDto } from '../adapters/inbound/migrate-from-template-response.dto';
import { MigrationCandidatesResponseDto } from '../adapters/inbound/migration-candidate-response.dto';
import { SalaryHistoryResponseDto } from '../adapters/inbound/salary-history-response.dto';
import { MIGRATION_BATCH_MAX } from '../domain/migration.constants';
import type { PreserveSalaryField } from '../domain/preserve-salary-field';
import type { SalaryComponents } from '../domain/salary-components';
import type { SalaryRecord } from '../domain/salary-record.model';
import { parseMoney } from './compute-total-compensation';
import { toSalaryRecordResponseDto } from './salary-record.mapper';
import {
  SALARY_RECORD_REPOSITORY,
  type SalaryRecordRepositoryPort,
} from '../ports/outbound/salary-record.repository.port';

@Injectable()
export class SalaryService {
  constructor(
    @Inject(SALARY_RECORD_REPOSITORY)
    private readonly salaryRecordRepository: SalaryRecordRepositoryPort,
    private readonly employeeService: EmployeeService,
    private readonly salaryTemplateService: SalaryTemplateService,
    @Inject(forwardRef(() => SalaryDraftService))
    private readonly salaryDraftService: SalaryDraftService,
  ) {}

  async getHistory(
    employeeId: string,
    query: PaginationQueryDto,
  ): Promise<SalaryHistoryResponseDto> {
    await this.employeeService.findOne(employeeId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const result = await this.salaryRecordRepository.findByEmployeeId(
      employeeId,
      { page, limit },
    );
    const meta = getPaginationMeta(result.total, page, limit);

    return {
      data: result.data.map(toSalaryRecordResponseDto),
      ...meta,
    };
  }

  async listMigrationCandidates(
    templateId: string,
    query: PaginationQueryDto,
  ): Promise<MigrationCandidatesResponseDto> {
    const target = await this.salaryTemplateService.findOne(templateId);
    const family = await this.salaryTemplateService.findAllByName(target.name);
    const sourceTemplateIds = family
      .filter((template) => template.id !== templateId)
      .map((template) => template.id);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const result = await this.salaryRecordRepository.findMigrationCandidates(
      sourceTemplateIds,
      { page, limit },
    );
    const meta = getPaginationMeta(result.total, page, limit);

    return {
      data: result.data,
      ...meta,
    };
  }

  async migrateFromTemplate(
    templateId: string,
    dto: MigrateFromTemplateDto,
    createdBy: string,
  ): Promise<MigrateFromTemplateResponseDto> {
    const uniqueEmployeeIds = [...new Set(dto.employeeIds)];
    if (uniqueEmployeeIds.length > MIGRATION_BATCH_MAX) {
      throw new BadRequestException(
        `Cannot migrate more than ${MIGRATION_BATCH_MAX} employees at once`,
      );
    }

    const template = await this.salaryTemplateService.findOne(templateId);
    const family = await this.salaryTemplateService.findAllByName(template.name);
    const sourceTemplateIds = new Set(
      family
        .filter((row) => row.id !== templateId)
        .map((row) => row.id),
    );

    const employees = await this.employeeService.findByIds(uniqueEmployeeIds);
    const employeeById = new Map(employees.map((row) => [row.id, row]));

    const missingIds = uniqueEmployeeIds.filter((id) => !employeeById.has(id));
    if (missingIds.length > 0) {
      throw new BadRequestException(
        `Employees not found: ${missingIds.join(', ')}`,
      );
    }

    for (const employeeId of uniqueEmployeeIds) {
      const employee = employeeById.get(employeeId)!;
      if (employee.status !== EmployeeStatus.Active) {
        throw new BadRequestException(
          `Cannot migrate Left employee ${employeeId}`,
        );
      }
    }

    const currentSalaryIds = uniqueEmployeeIds
      .map((id) => employeeById.get(id)!.currentSalaryId)
      .filter((id): id is string => id !== null);

    const salaryRecords =
      await this.salaryRecordRepository.findByIds(currentSalaryIds);
    const salaryById = new Map(salaryRecords.map((row) => [row.id, row]));

    for (const employeeId of uniqueEmployeeIds) {
      const employee = employeeById.get(employeeId)!;
      if (!employee.currentSalaryId) {
        throw new BadRequestException(
          `Employee ${employeeId} has no committed salary to migrate from`,
        );
      }

      const current = salaryById.get(employee.currentSalaryId);
      if (!current?.templateId || !sourceTemplateIds.has(current.templateId)) {
        throw new BadRequestException(
          `Employee ${employeeId} is not eligible to migrate to this template version`,
        );
      }
    }

    const preserve = new Set(dto.preserveFields);
    const bulkItems = uniqueEmployeeIds.map((employeeId) => {
      const employee = employeeById.get(employeeId)!;
      const current = salaryById.get(employee.currentSalaryId!) ?? null;
      return {
        employee,
        dto: this.buildDraftFromTemplate(template, current, preserve, dto),
      };
    });

    const drafts = await this.salaryDraftService.bulkUpsert(
      bulkItems,
      createdBy,
    );

    return {
      draftsCreated: drafts.length,
      drafts,
    };
  }

  private buildDraftFromTemplate(
    template: SalaryTemplate,
    current: SalaryRecord | null,
    preserve: Set<PreserveSalaryField>,
    dto: MigrateFromTemplateDto,
  ): UpsertSalaryDraftDto {
    const currentComponents = current?.components ?? {};

    const baseSalary = preserve.has('baseSalary')
      ? current
        ? parseMoney(current.baseSalary)
        : template.components.basePay
      : template.components.basePay;

    const currency = preserve.has('currency')
      ? (current?.currency ?? template.currency)
      : template.currency;

    const paymentCycle = preserve.has('paymentCycle')
      ? (current?.paymentCycle ?? PaymentCycle.Monthly)
      : (current?.paymentCycle ?? PaymentCycle.Monthly);

    const allowances = preserve.has('allowances')
      ? currentComponents.allowances
      : template.components.allowances;

    const bonus = preserve.has('bonus')
      ? currentComponents.bonus
      : template.components.bonus;

    const stock = preserve.has('stock')
      ? currentComponents.stock
      : template.components.stock;

    const components: SalaryComponents = {
      ...(allowances !== undefined ? { allowances } : {}),
      ...(bonus !== undefined ? { bonus } : {}),
      ...(stock ? { stock } : {}),
    };

    return {
      templateId: template.id,
      effectiveDate: dto.effectiveDate,
      baseSalary,
      currency,
      paymentCycle,
      components,
      reason:
        dto.reason ??
        `Migrate to template ${template.name} v${template.version}`,
    };
  }
}
