import type { Settings } from './settings.model';
import { SETTINGS_ID } from './settings.model';

export const DEFAULT_SETTINGS: Settings = {
  id: SETTINGS_ID,
  baseCurrency: 'USD',
  supportedCurrencies: ['USD', 'GBP', 'INR', 'EUR', 'SGD'],
  supportedCountries: ['US', 'UK', 'India', 'Germany', 'Singapore'],
  totalStocks: 100_000,
  stockPrice: '150.00',
  stockPriceCurrency: 'USD',
  lastFxSyncAt: null,
};
