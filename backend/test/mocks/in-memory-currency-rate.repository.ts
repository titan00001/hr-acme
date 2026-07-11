import { Injectable } from '@nestjs/common';
import type { CurrencyRate } from '../../src/modules/currency-rates/domain/currency-rate.model';
import type { CurrencyRateRepositoryPort } from '../../src/modules/currency-rates/ports/outbound/currency-rate.repository.port';

@Injectable()
export class InMemoryCurrencyRateRepository implements CurrencyRateRepositoryPort {
  private rates: CurrencyRate[] = [];

  findAll(): Promise<CurrencyRate[]> {
    return Promise.resolve([...this.rates]);
  }

  findRate(
    baseCurrency: string,
    targetCurrency: string,
  ): Promise<CurrencyRate | null> {
    const row = this.rates.find(
      (rate) =>
        rate.baseCurrency === baseCurrency.toUpperCase() &&
        rate.targetCurrency === targetCurrency.toUpperCase(),
    );
    return Promise.resolve(row ? { ...row } : null);
  }

  upsertRates(
    baseCurrency: string,
    rates: Record<string, number>,
    syncedAt: Date,
  ): Promise<number> {
    const base = baseCurrency.toUpperCase();
    let count = 0;

    for (const [targetCurrency, rate] of Object.entries(rates)) {
      if (targetCurrency.toUpperCase() === base) {
        continue;
      }

      const existingIndex = this.rates.findIndex(
        (row) =>
          row.baseCurrency === base &&
          row.targetCurrency === targetCurrency.toUpperCase(),
      );
      const nextRate: CurrencyRate = {
        id:
          existingIndex >= 0
            ? this.rates[existingIndex].id
            : `${base}-${targetCurrency}`,
        baseCurrency: base,
        targetCurrency: targetCurrency.toUpperCase(),
        rate: rate.toFixed(8),
        syncedAt,
      };

      if (existingIndex >= 0) {
        this.rates[existingIndex] = nextRate;
      } else {
        this.rates.push(nextRate);
      }
      count += 1;
    }

    return Promise.resolve(count);
  }

  seed(rate: CurrencyRate): void {
    this.rates.push({ ...rate });
  }

  clear(): void {
    this.rates = [];
  }
}
