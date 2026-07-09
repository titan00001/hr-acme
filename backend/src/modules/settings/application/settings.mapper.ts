import type { Settings } from '../domain/settings.model';
import { SettingsResponseDto } from '../adapters/inbound/settings-response.dto';

export function toSettingsResponseDto(settings: Settings): SettingsResponseDto {
  return {
    id: settings.id,
    baseCurrency: settings.baseCurrency,
    supportedCurrencies: settings.supportedCurrencies,
    supportedCountries: settings.supportedCountries,
    totalStocks: settings.totalStocks,
    stockPrice: Number(settings.stockPrice),
    stockPriceCurrency: settings.stockPriceCurrency,
    lastFxSyncAt: settings.lastFxSyncAt,
  };
}
