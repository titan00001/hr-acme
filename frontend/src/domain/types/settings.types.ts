/** Mirrors backend SettingsResponseDto */
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

/** Mirrors backend UpdateSettingsDto */
export interface UpdateSettingsRequest {
  baseCurrency?: string;
  supportedCurrencies?: string[];
  supportedCountries?: string[];
  totalStocks?: number;
  stockPrice?: number;
  stockPriceCurrency?: string;
}

/** Mirrors backend CurrencyRateResponseDto */
export interface CurrencyRate {
  id: string;
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
  syncedAt: string;
}

/** Mirrors backend SyncCurrencyRatesResponseDto */
export interface SyncCurrencyRatesResult {
  synced: number;
  lastFxSyncAt: string;
}

/** Mirrors backend DemoStatusResponseDto */
export interface DemoStatus {
  seeded: boolean;
  employeeCount: number;
}

export interface DemoSeedResult {
  inserted: number;
}

export interface DemoClearResult {
  cleared: boolean;
}
