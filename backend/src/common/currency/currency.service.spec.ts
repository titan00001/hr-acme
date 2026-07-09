import { CurrencyService } from './currency.service';

describe('CurrencyService', () => {
  const service = new CurrencyService();

  it('returns same amount when currencies match (case-insensitive)', () => {
    expect(service.normalize(100, 'usd', 'USD')).toBe(100);
  });

  it('throws for non-finite amount', () => {
    expect(() => service.normalize(Number.NaN, 'USD', 'USD')).toThrow(
      /finite number/i,
    );
  });

  it('currently returns amount unchanged for different currencies (stub)', () => {
    expect(service.normalize(200, 'USD', 'EUR')).toBe(200);
  });
});
