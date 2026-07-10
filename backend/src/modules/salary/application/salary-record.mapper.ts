import type { SalaryRecord } from '../domain/salary-record.model';
import { SalaryRecordResponseDto } from '../adapters/inbound/salary-record-response.dto';

export function toSalaryRecordResponseDto(
  record: SalaryRecord,
): SalaryRecordResponseDto {
  return {
    id: record.id,
    employeeId: record.employeeId,
    templateId: record.templateId,
    effectiveDate: record.effectiveDate,
    baseSalary: record.baseSalary,
    currency: record.currency,
    paymentCycle: record.paymentCycle,
    components: record.components as Record<string, unknown>,
    totalCompensation: record.totalCompensation,
    stockPriceAtEntry: record.stockPriceAtEntry,
    stockPriceCurrencyAtEntry: record.stockPriceCurrencyAtEntry,
    stockValueInStockCurrency: record.stockValueInStockCurrency,
    stockValueInSalaryCurrency: record.stockValueInSalaryCurrency,
    fxRateUsed: record.fxRateUsed,
    reason: record.reason,
    createdBy: record.createdBy,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
