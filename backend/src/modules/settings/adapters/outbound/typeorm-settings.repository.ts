import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Settings } from '../../domain/settings.model';
import { SettingsRepositoryPort } from '../../ports/outbound/settings.repository.port';
import { SettingsEntity } from './settings.entity';

function toDomain(entity: SettingsEntity): Settings {
  return {
    id: entity.id,
    baseCurrency: entity.baseCurrency,
    supportedCurrencies: entity.supportedCurrencies,
    supportedCountries: entity.supportedCountries,
    totalStocks: entity.totalStocks,
    stockPrice: entity.stockPrice,
    stockPriceCurrency: entity.stockPriceCurrency,
    lastFxSyncAt: entity.lastFxSyncAt,
  };
}

function toEntity(settings: Settings): SettingsEntity {
  const entity = new SettingsEntity();
  entity.id = settings.id;
  entity.baseCurrency = settings.baseCurrency;
  entity.supportedCurrencies = settings.supportedCurrencies;
  entity.supportedCountries = settings.supportedCountries;
  entity.totalStocks = settings.totalStocks;
  entity.stockPrice = settings.stockPrice;
  entity.stockPriceCurrency = settings.stockPriceCurrency;
  entity.lastFxSyncAt = settings.lastFxSyncAt;
  return entity;
}

@Injectable()
export class TypeOrmSettingsRepository implements SettingsRepositoryPort {
  constructor(
    @InjectRepository(SettingsEntity)
    private readonly repository: Repository<SettingsEntity>,
  ) {}

  async findById(id: number): Promise<Settings | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? toDomain(entity) : null;
  }

  async save(settings: Settings): Promise<Settings> {
    const saved = await this.repository.save(toEntity(settings));
    return toDomain(saved);
  }
}
