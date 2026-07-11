import type {
  DraftEmployeeSummary,
  SalaryDraft,
  SalaryDraftListItem,
} from '../domain/salary-draft.model';
import { SalaryDraftResponseDto } from '../adapters/inbound/salary-draft-response.dto';

export function toSalaryDraftResponseDto(
  draft: SalaryDraft,
  employee: DraftEmployeeSummary,
): SalaryDraftResponseDto {
  return {
    id: draft.id,
    employeeId: draft.employeeId,
    employee,
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

export function toSalaryDraftListResponseDto(
  item: SalaryDraftListItem,
): SalaryDraftResponseDto {
  return toSalaryDraftResponseDto(item, item.employee);
}

export function toDraftEmployeeSummary(employee: {
  employeeId: string;
  name: string;
  email: string;
}): DraftEmployeeSummary {
  return {
    employeeId: employee.employeeId,
    name: employee.name,
    email: employee.email,
  };
}
