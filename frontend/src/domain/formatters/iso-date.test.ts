import { describe, expect, it } from 'vitest';

import { defaultTrendsRange, toIsoDate } from './iso-date';

describe('iso-date', () => {
  it('formats local calendar dates as YYYY-MM-DD', () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('defaults trends range to year start through today', () => {
    expect(defaultTrendsRange(new Date(2026, 6, 11))).toEqual({
      from: '2026-01-01',
      to: '2026-07-11',
    });
  });
});
