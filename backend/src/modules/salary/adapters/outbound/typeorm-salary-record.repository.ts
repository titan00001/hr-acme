import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { SalaryRecord } from '../../domain/salary-record.model';
import { SalaryRecordRepositoryPort } from '../../ports/outbound/salary-record.repository.port';
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

  async save(record: SalaryRecord): Promise<SalaryRecord> {
    const saved = await this.repository.save(toEntity(record));
    return toDomain(saved);
  }
}
