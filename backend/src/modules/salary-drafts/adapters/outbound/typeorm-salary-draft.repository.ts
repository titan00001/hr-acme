import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { safeOrderBy } from '../../../../common/pagination/pagination.utils';
import type { SalaryDraft } from '../../domain/salary-draft.model';
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

@Injectable()
export class TypeOrmSalaryDraftRepository implements SalaryDraftRepositoryPort {
  constructor(
    @InjectRepository(SalaryDraftEntity)
    private readonly repository: Repository<SalaryDraftEntity>,
  ) {}

  async findById(id: string): Promise<SalaryDraft | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? toDomain(entity) : null;
  }

  async findByEmployeeId(employeeId: string): Promise<SalaryDraft | null> {
    const entity = await this.repository.findOne({ where: { employeeId } });
    return entity ? toDomain(entity) : null;
  }

  async findMany(query: SalaryDraftListQuery): Promise<SalaryDraftListResult> {
    const qb = this.repository.createQueryBuilder('draft');

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

    qb.skip((query.page - 1) * query.limit).take(query.limit);

    const [entities, total] = await qb.getManyAndCount();

    return {
      data: entities.map(toDomain),
      total,
    };
  }

  async save(draft: SalaryDraft): Promise<SalaryDraft> {
    const saved = await this.repository.save(toEntity(draft));
    return toDomain(saved);
  }

  async update(draft: SalaryDraft): Promise<SalaryDraft> {
    const saved = await this.repository.save(toEntity(draft));
    return toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
