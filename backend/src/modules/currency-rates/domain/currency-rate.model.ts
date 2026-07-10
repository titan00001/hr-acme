export interface CurrencyRate {
  id: string;
  baseCurrency: string;
  targetCurrency: string;
  rate: string;
  syncedAt: Date;
}
