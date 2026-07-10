export function computeTotalCompensation(input: {
  baseSalary: number;
  allowances?: number;
  bonus?: number;
  stockValueInSalaryCurrency?: number | null;
}): number {
  const allowances = input.allowances ?? 0;
  const bonus = input.bonus ?? 0;
  const stock = input.stockValueInSalaryCurrency ?? 0;

  return input.baseSalary + allowances + bonus + stock;
}

export function toMoneyString(value: number): string {
  return value.toFixed(2);
}

export function toRateString(value: number): string {
  return value.toFixed(6);
}

export function parseMoney(value: string | number): number {
  return typeof value === 'number' ? value : Number(value);
}
