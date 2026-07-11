import { describe, expect, it } from 'vitest';

import { salaryDraftFormSchema } from './salary-draft-form.schema';

describe('salaryDraftFormSchema', () => {
  it('accepts each paymentCycle enum value', () => {
    for (const paymentCycle of ['Monthly', 'BiWeekly', 'Weekly', 'Annual']) {
      const result = salaryDraftFormSchema.safeParse({
        effectiveDate: '2026-04-01',
        baseSalary: 1000,
        currency: 'USD',
        paymentCycle,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects an invalid paymentCycle', () => {
    const result = salaryDraftFormSchema.safeParse({
      effectiveDate: '2026-04-01',
      baseSalary: 1000,
      currency: 'USD',
      paymentCycle: 'Daily',
    });
    expect(result.success).toBe(false);
  });
});
