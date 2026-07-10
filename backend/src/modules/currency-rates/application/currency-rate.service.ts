import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SettingsService } from '../../settings/application/settings.service';
import type { CurrencyRate } from '../domain/currency-rate.model';
import {
  CURRENCY_RATE_REPOSITORY,
  type CurrencyRateRepositoryPort,
} from '../ports/outbound/currency-rate.repository.port';
import {
  EXCHANGE_RATE_PORT,
  type ExchangeRatePort,
} from '../ports/outbound/exchange-rate.port';

@Injectable()
export class CurrencyRateService {
  constructor(
    @Inject(CURRENCY_RATE_REPOSITORY)
    private readonly currencyRateRepository: CurrencyRateRepositoryPort,
    @Inject(EXCHANGE_RATE_PORT)
    private readonly exchangeRatePort: ExchangeRatePort,
    private readonly settingsService: SettingsService,
  ) {}

  async findAll(): Promise<CurrencyRate[]> {
    return this.currencyRateRepository.findAll();
  }

  async sync(): Promise<{ synced: number; lastFxSyncAt: Date }> {
    const settings = await this.settingsService.get();
    const baseCurrency = settings.baseCurrency.toUpperCase();
    const syncedAt = new Date();
    const rates = await this.exchangeRatePort.fetchLatestRates(baseCurrency);
    const synced = await this.currencyRateRepository.upsertRates(
      baseCurrency,
      rates,
      syncedAt,
    );

    await this.settingsService.setLastFxSyncAt(syncedAt);

    return { synced, lastFxSyncAt: syncedAt };
  }

  async getRate(from: string, to: string): Promise<number> {
    const fromCode = from.toUpperCase();
    const toCode = to.toUpperCase();

    if (fromCode === toCode) {
      return 1;
    }

    const settings = await this.settingsService.get();
    const base = settings.baseCurrency.toUpperCase();

    const baseToTarget = async (currency: string): Promise<number> => {
      if (currency === base) {
        return 1;
      }

      const row = await this.currencyRateRepository.findRate(base, currency);
      if (!row) {
        throw new NotFoundException(
          `FX rate not found for ${base} -> ${currency}`,
        );
      }

      return Number(row.rate);
    };

    const oneFromInBase =
      fromCode === base ? 1 : 1 / (await baseToTarget(fromCode));
    const oneBaseInTo = toCode === base ? 1 : await baseToTarget(toCode);

    return oneFromInBase * oneBaseInTo;
  }
}
