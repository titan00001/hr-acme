import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EmployeeStatus } from '../../../../common/enums/employee-status.enum';
import { EmployeeEntity } from '../../../employees/adapters/outbound/employee.entity';
import { SalaryTemplateEntity } from '../../../salary-templates/adapters/outbound/salary-template.entity';
import type { MigrationCandidate } from '../../domain/migration-candidate.model';
import type { SalaryRecord } from '../../domain/salary-record.model';
import {
  MigrationCandidatesResult,
  SalaryHistoryQuery,
  SalaryHistoryResult,
  SalaryRecordRepositoryPort,
} from '../../ports/outbound/salary-record.repository.port';
import { SalaryRecordEntity } from './salary-record.entity';

function toDomain(entity: SalaryRecordEntity): SalaryRecord {
  const effectiveDate =
    typeof entity.effectiveDate === 'string'
      ? entity.effectiveDate
      : new Date(entity.effectiveDate).toISOString().slice(0, 10);

  return {
    id: entity.id,
    employeeId: entity.employeeId,
    templateId: entity.templateId,
    effectiveDate,
    baseSalary: entity.baseSalary,
    currency: entity.currency,
    paymentCycle: entity.paymentCycle,
    components: entity.components ?? {},
    totalCompensation: entity.totalCompensation,
    stockPriceAtEntry: entity.stockPriceAtEntry,
    stockPriceCurrencyAtEntry: entity.stockPriceCurrencyAtEntry,
    stockValueInStockCurrency: entity.stockValueInStockCurrency,
    stockValueInSalaryCurrency: entity.stockValueInSalaryCurrency,
    fxRateUsed: entity.fxRateUsed,
    reason: entity.reason,
    createdBy: entity.createdBy,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

function toEntity(record: SalaryRecord): SalaryRecordEntity {
  const entity = new SalaryRecordEntity();
  entity.id = record.id;
  entity.employeeId = record.employeeId;
  entity.templateId = record.templateId;
  entity.effectiveDate = record.effectiveDate;
  entity.baseSalary = record.baseSalary;
  entity.currency = record.currency;
  entity.paymentCycle = record.paymentCycle;
  entity.components = record.components;
  entity.totalCompensation = record.totalCompensation;
  entity.stockPriceAtEntry = record.stockPriceAtEntry;
  entity.stockPriceCurrencyAtEntry = record.stockPriceCurrencyAtEntry;
  entity.stockValueInStockCurrency = record.stockValueInStockCurrency;
  entity.stockValueInSalaryCurrency = record.stockValueInSalaryCurrency;
  entity.fxRateUsed = record.fxRateUsed;
  entity.reason = record.reason;
  entity.createdBy = record.createdBy;
  entity.createdAt = record.createdAt;
  entity.updatedAt = record.updatedAt;
  return entity;
}

@Injectable()
export class TypeOrmSalaryRecordRepository implements SalaryRecordRepositoryPort {
  constructor(
    @InjectRepository(SalaryRecordEntity)
    private readonly repository: Repository<SalaryRecordEntity>,
  ) {}

  async findById(id: string): Promise<SalaryRecord | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? toDomain(entity) : null;
  }

  async findByIds(ids: string[]): Promise<SalaryRecord[]> {
    if (ids.length === 0) {
      return [];
    }
    const entities = await this.repository.find({ where: { id: In(ids) } });
    return entities.map(toDomain);
  }

  async findByEmployeeId(
    employeeId: string,
    query: SalaryHistoryQuery,
  ): Promise<SalaryHistoryResult> {
    const qb = this.repository
      .createQueryBuilder('record')
      .where('record.employeeId = :employeeId', { employeeId })
      .orderBy('record.effectiveDate', 'DESC')
      .addOrderBy('record.createdAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    const [entities, total] = await qb.getManyAndCount();

    return {
      data: entities.map(toDomain),
      total,
    };
  }

  async findMigrationCandidates(
    sourceTemplateIds: string[],
    query: SalaryHistoryQuery,
  ): Promise<MigrationCandidatesResult> {
    if (sourceTemplateIds.length === 0) {
      return { data: [], total: 0 };
    }

    const baseQb = () =>
      this.repository.manager
        .createQueryBuilder()
        .from(EmployeeEntity, 'employee')
        .innerJoin(
          SalaryRecordEntity,
          'salary',
          'salary.id = employee.currentSalaryId',
        )
        .innerJoin(
          SalaryTemplateEntity,
          'template',
          'template.id = salary.templateId',
        )
        .where('employee.status = :status', { status: EmployeeStatus.Active })
        .andWhere('salary.templateId IN (:...sourceTemplateIds)', {
          sourceTemplateIds,
        });

    const total = await baseQb().getCount();

    const rows = await baseQb()
      .select([
        'employee.id AS id',
        'employee.employee_id AS "employeeId"',
        'employee.name AS name',
        'employee.email AS email',
        'employee.country AS country',
        'salary.template_id AS "currentTemplateId"',
        'template.version AS "currentTemplateVersion"',
        'salary.total_compensation AS "totalCompensation"',
        'salary.currency AS "salaryCurrency"',
      ])
      .orderBy('employee.name', 'ASC')
      .offset((query.page - 1) * query.limit)
      .limit(query.limit)
      .getRawMany<{
        id: string;
        employeeId: string;
        name: string;
        email: string;
        country: string;
        currentTemplateId: string;
        currentTemplateVersion: string | number;
        totalCompensation: string | null;
        salaryCurrency: string | null;
      }>();

    const data: MigrationCandidate[] = rows.map((row) => ({
      id: row.id,
      employeeId: row.employeeId,
      name: row.name,
      email: row.email,
      country: row.country,
      currentTemplateId: row.currentTemplateId,
      currentTemplateVersion: Number(row.currentTemplateVersion),
      currentSalary:
        row.totalCompensation && row.salaryCurrency
          ? {
              totalCompensation: row.totalCompensation,
              currency: row.salaryCurrency,
            }
          : null,
    }));

    return { data, total };
  }

  async save(record: SalaryRecord): Promise<SalaryRecord> {
    const saved = await this.repository.save(toEntity(record));
    return toDomain(saved);
  }
}
