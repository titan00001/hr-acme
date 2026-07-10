export const EXCHANGE_RATE_PORT = Symbol('EXCHANGE_RATE_PORT');

export interface ExchangeRatePort {
  fetchLatestRates(baseCurrency: string): Promise<Record<string, number>>;
}
