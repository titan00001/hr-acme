import type { SalaryComponents } from '@/domain/types/salary.types';

/** Mirrors backend computeTotalCompensation for draft preview. */
export function computeDraftProposedTotal(input: {
  baseSalary: string | number;
  components?: SalaryComponents | null;
  stockValueInSalaryCurrency?: string | null;
}): number {
  const base =
    typeof input.baseSalary === 'string'
      ? Number(input.baseSalary)
      : input.baseSalary;
  const allowances = input.components?.allowances ?? 0;
  const bonus = input.components?.bonus ?? 0;
  const stockValue = input.stockValueInSalaryCurrency
    ? Number(input.stockValueInSalaryCurrency)
    : 0;

  return (
    (Number.isFinite(base) ? base : 0) +
    allowances +
    bonus +
    (Number.isFinite(stockValue) ? stockValue : 0)
  );
}
