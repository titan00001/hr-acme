import { randomUUID } from 'crypto';
import {
  computeTotalCompensation,
  parseMoney,
  toMoneyString,
} from '../../salary/application/compute-total-compensation';
import type { SalaryRecord } from '../../salary/domain/salary-record.model';
import type { SalaryDraft } from '../domain/salary-draft.model';

/** Factory: build an append-only SalaryRecord from a committed draft. */
export function createSalaryRecordFromDraft(
  draft: SalaryDraft,
  createdBy: string,
  now = new Date(),
): SalaryRecord {
  const total = computeTotalCompensation({
    baseSalary: parseMoney(draft.baseSalary),
    allowances: draft.components.allowances,
    bonus: draft.components.bonus,
    stockValueInSalaryCurrency: draft.stockValueInSalaryCurrency
      ? parseMoney(draft.stockValueInSalaryCurrency)
      : null,
  });

  return {
    id: randomUUID(),
    employeeId: draft.employeeId,
    templateId: draft.templateId,
    effectiveDate: draft.effectiveDate,
    baseSalary: draft.baseSalary,
    currency: draft.currency,
    paymentCycle: draft.paymentCycle,
    components: { ...draft.components },
    totalCompensation: toMoneyString(total),
    stockPriceAtEntry: draft.stockPriceAtEntry,
    stockPriceCurrencyAtEntry: draft.stockPriceCurrencyAtEntry,
    stockValueInStockCurrency: draft.stockValueInStockCurrency,
    stockValueInSalaryCurrency: draft.stockValueInSalaryCurrency,
    fxRateUsed: draft.fxRateUsed,
    reason: draft.reason,
    createdBy,
    createdAt: now,
    updatedAt: now,
  };
}
