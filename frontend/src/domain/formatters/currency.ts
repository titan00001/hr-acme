export function formatCurrency(
  amount: string | number,
  currency: string,
  locale = 'en-IN',
): string {
  const value = typeof amount === 'string' ? Number(amount) : amount;

  if (Number.isNaN(value)) {
    return `${amount} ${currency}`;
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toLocaleString(locale)} ${currency}`;
  }
}

export function formatSalarySummary(
  salary: { totalCompensation: string; currency: string } | null,
): string {
  if (!salary) {
    return '—';
  }

  return formatCurrency(salary.totalCompensation, salary.currency);
}
