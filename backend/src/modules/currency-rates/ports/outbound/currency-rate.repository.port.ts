import type { CurrencyRate } from '../../domain/currency-rate.model';

export const CURRENCY_RATE_REPOSITORY = Symbol('CURRENCY_RATE_REPOSITORY');

export interface CurrencyRateRepositoryPort {
  findAll(): Promise<CurrencyRate[]>;
  findRate(
    baseCurrency: string,
    targetCurrency: string,
  ): Promise<CurrencyRate | null>;
  upsertRates(
    baseCurrency: string,
    rates: Record<string, number>,
    syncedAt: Date,
  ): Promise<number>;
}
