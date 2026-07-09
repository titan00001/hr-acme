export const SETTINGS_ID = 1;

export interface Settings {
  id: number;
  baseCurrency: string;
  supportedCurrencies: string[];
  supportedCountries: string[];
  totalStocks: number;
  stockPrice: string;
  stockPriceCurrency: string;
  lastFxSyncAt: Date | null;
}
