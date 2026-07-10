import { Injectable } from '@nestjs/common';
import type { ExchangeRatePort } from '../../src/modules/currency-rates/ports/outbound/exchange-rate.port';

@Injectable()
export class MockExchangeRatePort implements ExchangeRatePort {
  private rates: Record<string, number> = {
    USD: 1,
    INR: 83,
    EUR: 0.92,
    GBP: 0.79,
    SGD: 1.35,
  };

  setRates(rates: Record<string, number>): void {
    this.rates = rates;
  }

  fetchLatestRates(baseCurrency: string): Promise<Record<string, number>> {
    void baseCurrency;
    return Promise.resolve({ ...this.rates });
  }
}
