import { Inject, Injectable } from '@nestjs/common';
import { DEFAULT_SETTINGS } from '../domain/default-settings';
import type { Settings } from '../domain/settings.model';
import { SETTINGS_ID } from '../domain/settings.model';
import {
  SETTINGS_REPOSITORY,
  type SettingsRepositoryPort,
} from '../ports/outbound/settings.repository.port';
import { UpdateSettingsDto } from '../adapters/inbound/update-settings.dto';

@Injectable()
export class SettingsService {
  private cache: Settings | null = null;

  constructor(
    @Inject(SETTINGS_REPOSITORY)
    private readonly settingsRepository: SettingsRepositoryPort,
  ) {}

  async get(): Promise<Settings> {
    if (this.cache) {
      return this.cache;
    }

    const existing = await this.settingsRepository.findById(SETTINGS_ID);
    const settings = existing ?? (await this.seedDefaults());
    this.cache = settings;
    return settings;
  }

  async update(dto: UpdateSettingsDto): Promise<Settings> {
    const current = await this.get();
    const updated: Settings = {
      ...current,
      ...this.mapUpdateDto(dto),
      id: SETTINGS_ID,
    };

    const saved = await this.settingsRepository.save(updated);
    this.cache = saved;
    return saved;
  }

  async getCountries(): Promise<string[]> {
    return (await this.get()).supportedCountries;
  }

  async getCurrencies(): Promise<string[]> {
    return (await this.get()).supportedCurrencies;
  }

  async setLastFxSyncAt(syncedAt: Date): Promise<Settings> {
    const current = await this.get();
    const saved = await this.settingsRepository.save({
      ...current,
      lastFxSyncAt: syncedAt,
      id: SETTINGS_ID,
    });
    this.cache = saved;
    return saved;
  }

  invalidateCache(): void {
    this.cache = null;
  }

  private async seedDefaults(): Promise<Settings> {
    return this.settingsRepository.save({ ...DEFAULT_SETTINGS });
  }

  private mapUpdateDto(dto: UpdateSettingsDto): Partial<Settings> {
    const partial: Partial<Settings> = {};

    if (dto.baseCurrency !== undefined) {
      partial.baseCurrency = dto.baseCurrency;
    }
    if (dto.supportedCurrencies !== undefined) {
      partial.supportedCurrencies = dto.supportedCurrencies;
    }
    if (dto.supportedCountries !== undefined) {
      partial.supportedCountries = dto.supportedCountries;
    }
    if (dto.totalStocks !== undefined) {
      partial.totalStocks = dto.totalStocks;
    }
    if (dto.stockPrice !== undefined) {
      partial.stockPrice = dto.stockPrice.toFixed(2);
    }
    if (dto.stockPriceCurrency !== undefined) {
      partial.stockPriceCurrency = dto.stockPriceCurrency;
    }

    return partial;
  }
}
