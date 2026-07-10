import type { SalaryDraft } from '../domain/salary-draft.model';
import { SalaryDraftResponseDto } from '../adapters/inbound/salary-draft-response.dto';
import type { SalaryRecord } from '../../salary/domain/salary-record.model';
import { SalaryRecordResponseDto } from '../../salary/adapters/inbound/salary-record-response.dto';

export function toSalaryDraftResponseDto(
  draft: SalaryDraft,
): SalaryDraftResponseDto {
  return {
    id: draft.id,
    employeeId: draft.employeeId,
    templateId: draft.templateId,
    effectiveDate: draft.effectiveDate,
    baseSalary: draft.baseSalary,
    currency: draft.currency,
    paymentCycle: draft.paymentCycle,
    components: draft.components,
    stockPriceAtEntry: draft.stockPriceAtEntry,
    stockPriceCurrencyAtEntry: draft.stockPriceCurrencyAtEntry,
    stockValueInStockCurrency: draft.stockValueInStockCurrency,
    stockValueInSalaryCurrency: draft.stockValueInSalaryCurrency,
    fxRateUsed: draft.fxRateUsed,
    reason: draft.reason,
    createdBy: draft.createdBy,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
  };
}

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
