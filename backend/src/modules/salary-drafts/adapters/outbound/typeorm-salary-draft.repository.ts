import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { PaymentCycle } from '../../../../common/enums/payment-cycle.enum';
import { safeOrderBy } from '../../../../common/pagination/pagination.utils';
import { EmployeeEntity } from '../../../employees/adapters/outbound/employee.entity';
import type {
  DraftEmployeeSummary,
  SalaryDraft,
  SalaryDraftListItem,
} from '../../domain/salary-draft.model';
import type { SalaryComponents } from '../../../salary/domain/salary-components';
import {
  SalaryDraftListQuery,
  SalaryDraftListResult,
  SalaryDraftRepositoryPort,
} from '../../ports/outbound/salary-draft.repository.port';
import { SalaryDraftEntity } from './salary-draft.entity';

const ALLOWED_SORT_FIELDS = [
  'effectiveDate',
  'currency',
  'createdAt',
  'updatedAt',
] as const;

type RawDraftListRow = {
  id: string;
  employeeId: string;
  templateId: string | null;
  effectiveDate: string | Date;
  baseSalary: string;
  currency: string;
  paymentCycle: PaymentCycle;
  components: SalaryComponents | string | null;
  stockPriceAtEntry: string | null;
  stockPriceCurrencyAtEntry: string | null;
  stockValueInStockCurrency: string | null;
  stockValueInSalaryCurrency: string | null;
  fxRateUsed: string | null;
  reason: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  bizEmployeeId: string | null;
  employeeName: string | null;
  employeeEmail: string | null;
};

function toDomain(entity: SalaryDraftEntity): SalaryDraft {
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

function toEntity(draft: SalaryDraft): SalaryDraftEntity {
  const entity = new SalaryDraftEntity();
  entity.id = draft.id;
  entity.employeeId = draft.employeeId;
  entity.templateId = draft.templateId;
  entity.effectiveDate = draft.effectiveDate;
  entity.baseSalary = draft.baseSalary;
  entity.currency = draft.currency;
  entity.paymentCycle = draft.paymentCycle;
  entity.components = draft.components;
  entity.stockPriceAtEntry = draft.stockPriceAtEntry;
  entity.stockPriceCurrencyAtEntry = draft.stockPriceCurrencyAtEntry;
  entity.stockValueInStockCurrency = draft.stockValueInStockCurrency;
  entity.stockValueInSalaryCurrency = draft.stockValueInSalaryCurrency;
  entity.fxRateUsed = draft.fxRateUsed;
  entity.reason = draft.reason;
  entity.createdBy = draft.createdBy;
  entity.createdAt = draft.createdAt;
  entity.updatedAt = draft.updatedAt;
  return entity;
}

function parseComponents(
  value: SalaryComponents | string | null,
): SalaryComponents {
  if (!value) {
    return {};
  }
  if (typeof value === 'string') {
    return JSON.parse(value) as SalaryComponents;
  }
  return value;
}

function toEmployeeSummary(row: RawDraftListRow): DraftEmployeeSummary {
  return {
    employeeId: row.bizEmployeeId ?? '',
    name: row.employeeName ?? '',
    email: row.employeeEmail ?? '',
  };
}

function mapRawListItem(row: RawDraftListRow): SalaryDraftListItem {
  const effectiveDate =
    typeof row.effectiveDate === 'string'
      ? row.effectiveDate
      : new Date(row.effectiveDate).toISOString().slice(0, 10);

  return {
    id: row.id,
    employeeId: row.employeeId,
    templateId: row.templateId,
    effectiveDate,
    baseSalary: String(row.baseSalary),
    currency: row.currency,
    paymentCycle: row.paymentCycle,
    components: parseComponents(row.components),
    stockPriceAtEntry:
      row.stockPriceAtEntry === null ? null : String(row.stockPriceAtEntry),
    stockPriceCurrencyAtEntry: row.stockPriceCurrencyAtEntry,
    stockValueInStockCurrency:
      row.stockValueInStockCurrency === null
        ? null
        : String(row.stockValueInStockCurrency),
    stockValueInSalaryCurrency:
      row.stockValueInSalaryCurrency === null
        ? null
        : String(row.stockValueInSalaryCurrency),
    fxRateUsed: row.fxRateUsed === null ? null : String(row.fxRateUsed),
    reason: row.reason,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    employee: toEmployeeSummary(row),
  };
}

const LIST_SELECT = [
  'draft.id AS id',
  'draft.employee_id AS "employeeId"',
  'draft.template_id AS "templateId"',
  'draft.effective_date AS "effectiveDate"',
  'draft.base_salary AS "baseSalary"',
  'draft.currency AS currency',
  'draft.payment_cycle AS "paymentCycle"',
  'draft.components AS components',
  'draft.stock_price_at_entry AS "stockPriceAtEntry"',
  'draft.stock_price_currency_at_entry AS "stockPriceCurrencyAtEntry"',
  'draft.stock_value_in_stock_currency AS "stockValueInStockCurrency"',
  'draft.stock_value_in_salary_currency AS "stockValueInSalaryCurrency"',
  'draft.fx_rate_used AS "fxRateUsed"',
  'draft.reason AS reason',
  'draft.created_by AS "createdBy"',
  'draft.created_at AS "createdAt"',
  'draft.updated_at AS "updatedAt"',
  'employee.employee_id AS "bizEmployeeId"',
  'employee.name AS "employeeName"',
  'employee.email AS "employeeEmail"',
] as const;

@Injectable()
export class TypeOrmSalaryDraftRepository implements SalaryDraftRepositoryPort {
  constructor(
    @InjectRepository(SalaryDraftEntity)
    private readonly repository: Repository<SalaryDraftEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async findById(id: string): Promise<SalaryDraft | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? toDomain(entity) : null;
  }

  async findListItemById(id: string): Promise<SalaryDraftListItem | null> {
    const row = await this.repository
      .createQueryBuilder('draft')
      .leftJoin(EmployeeEntity, 'employee', 'employee.id = draft.employeeId')
      .where('draft.id = :id', { id })
      .select([...LIST_SELECT])
      .getRawOne<RawDraftListRow>();

    return row ? mapRawListItem(row) : null;
  }

  async findByEmployeeId(employeeId: string): Promise<SalaryDraft | null> {
    const entity = await this.repository.findOne({ where: { employeeId } });
    return entity ? toDomain(entity) : null;
  }

  async findByEmployeeIds(employeeIds: string[]): Promise<SalaryDraft[]> {
    if (employeeIds.length === 0) {
      return [];
    }
    const entities = await this.repository.find({
      where: { employeeId: In(employeeIds) },
    });
    return entities.map(toDomain);
  }

  async findMany(query: SalaryDraftListQuery): Promise<SalaryDraftListResult> {
    const qb = this.repository
      .createQueryBuilder('draft')
      .leftJoin(EmployeeEntity, 'employee', 'employee.id = draft.employeeId');

    const order = safeOrderBy(
      query.sortBy,
      query.sortOrder,
      ALLOWED_SORT_FIELDS,
      'draft',
    );

    if (order) {
      qb.orderBy(`draft.${order.field}`, order.order);
    } else {
      qb.orderBy('draft.updatedAt', 'DESC');
    }

    const total = await qb.getCount();

    const rows = await qb
      .select([...LIST_SELECT])
      .offset((query.page - 1) * query.limit)
      .limit(query.limit)
      .getRawMany<RawDraftListRow>();

    return {
      data: rows.map(mapRawListItem),
      total,
    };
  }

  async save(draft: SalaryDraft): Promise<SalaryDraft> {
    const saved = await this.repository.save(toEntity(draft));
    return toDomain(saved);
  }

  async saveMany(drafts: SalaryDraft[]): Promise<SalaryDraft[]> {
    if (drafts.length === 0) {
      return [];
    }
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(SalaryDraftEntity);
      const saved = await repo.save(drafts.map(toEntity));
      return saved.map(toDomain);
    });
  }

  async update(draft: SalaryDraft): Promise<SalaryDraft> {
    const saved = await this.repository.save(toEntity(draft));
    return toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
