import { describe, expect, it } from 'vitest';

import {
  formatCurrency,
  formatSalarySummary,
} from '@/domain/formatters/currency';

describe('formatSalarySummary', () => {
  it('returns an em dash when salary is missing', () => {
    expect(formatSalarySummary(null)).toBe('—');
  });

  it('formats amount with currency code fallback when needed', () => {
    const formatted = formatCurrency('1000', 'INR');
    expect(formatted).toMatch(/1[,.]?0?0?0/);
    expect(formatted).toMatch(/₹|INR/);
  });
});
