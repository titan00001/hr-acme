import type { CurrencyRate } from '../domain/currency-rate.model';
import { CurrencyRateResponseDto } from '../adapters/inbound/currency-rate-response.dto';

export function toCurrencyRateResponseDto(
  rate: CurrencyRate,
): CurrencyRateResponseDto {
  return {
    id: rate.id,
    baseCurrency: rate.baseCurrency,
    targetCurrency: rate.targetCurrency,
    rate: Number(rate.rate),
    syncedAt: rate.syncedAt,
  };
}
