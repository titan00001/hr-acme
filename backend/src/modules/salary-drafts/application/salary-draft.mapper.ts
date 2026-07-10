import type { SalaryDraft } from '../domain/salary-draft.model';
import { SalaryDraftResponseDto } from '../adapters/inbound/salary-draft-response.dto';

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
