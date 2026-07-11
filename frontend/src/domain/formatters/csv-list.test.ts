import { describe, expect, it } from 'vitest';

import { formatCsvList, parseCsvList } from './csv-list';

describe('csv-list', () => {
  it('parses comma-separated values and drops blanks/duplicates', () => {
    expect(parseCsvList(' USD, inr,, USD , GBP ')).toEqual([
      'USD',
      'inr',
      'GBP',
    ]);
  });

  it('formats lists for inputs', () => {
    expect(formatCsvList(['USD', 'INR'])).toBe('USD, INR');
  });
});
