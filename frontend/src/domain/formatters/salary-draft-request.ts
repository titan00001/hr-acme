import type { SalaryDraftFormValues } from '@/domain/schemas/salary-draft-form.schema';
import type {
  PaymentCycle,
  UpsertSalaryDraftRequest,
} from '@/domain/types/salary.types';

export function toUpsertSalaryDraftRequest(
  values: SalaryDraftFormValues,
): UpsertSalaryDraftRequest {
  const components = {
    ...(values.allowances !== undefined ? { allowances: values.allowances } : {}),
    ...(values.bonus !== undefined ? { bonus: values.bonus } : {}),
    ...(values.stockQuantity !== undefined
      ? {
          stock: {
            quantity: values.stockQuantity,
            ...(values.stockVestingDate
              ? { vestingDate: values.stockVestingDate }
              : {}),
          },
        }
      : {}),
  };

  return {
    templateId: values.templateId ? values.templateId : null,
    effectiveDate: values.effectiveDate,
    baseSalary: values.baseSalary,
    currency: values.currency,
    paymentCycle: values.paymentCycle as PaymentCycle,
    ...(Object.keys(components).length > 0 ? { components } : {}),
    ...(values.reason?.trim() ? { reason: values.reason.trim() } : {}),
  };
}

export function optionalNumberFromInput(value: unknown): number | undefined {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
