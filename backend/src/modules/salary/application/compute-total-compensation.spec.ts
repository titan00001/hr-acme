import { computeTotalCompensation } from './compute-total-compensation';

describe('computeTotalCompensation', () => {
  it('sums base, allowances, bonus, and stock value', () => {
    expect(
      computeTotalCompensation({
        baseSalary: 1_200_000,
        allowances: 50_000,
        bonus: 100_000,
        stockValueInSalaryCurrency: 15_000,
      }),
    ).toBe(1_365_000);
  });

  it('treats missing optional parts as zero', () => {
    expect(computeTotalCompensation({ baseSalary: 100_000 })).toBe(100_000);
  });

  it('treats null stock value as zero', () => {
    expect(
      computeTotalCompensation({
        baseSalary: 100_000,
        stockValueInSalaryCurrency: null,
      }),
    ).toBe(100_000);
  });
});
