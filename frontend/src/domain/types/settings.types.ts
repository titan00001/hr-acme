/** Mirrors backend SettingsResponseDto (subset used by UI) */
export interface Settings {
  id: number;
  baseCurrency: string;
  supportedCurrencies: string[];
  supportedCountries: string[];
  totalStocks: number;
  stockPrice: number;
  stockPriceCurrency: string;
  lastFxSyncAt: string | null;
}
