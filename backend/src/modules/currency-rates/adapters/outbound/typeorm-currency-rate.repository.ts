import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { CurrencyRate } from '../../domain/currency-rate.model';
import { CurrencyRateRepositoryPort } from '../../ports/outbound/currency-rate.repository.port';
import { CurrencyRateEntity } from './currency-rate.entity';

function toDomain(entity: CurrencyRateEntity): CurrencyRate {
  return {
    id: entity.id,
    baseCurrency: entity.baseCurrency,
    targetCurrency: entity.targetCurrency,
    rate: entity.rate,
    syncedAt: entity.syncedAt,
  };
}

@Injectable()
export class TypeOrmCurrencyRateRepository implements CurrencyRateRepositoryPort {
  constructor(
    @InjectRepository(CurrencyRateEntity)
    private readonly repository: Repository<CurrencyRateEntity>,
  ) {}

  async findAll(): Promise<CurrencyRate[]> {
    const rows = await this.repository.find({
      order: { baseCurrency: 'ASC', targetCurrency: 'ASC' },
    });
    return rows.map(toDomain);
  }

  async findRate(
    baseCurrency: string,
    targetCurrency: string,
  ): Promise<CurrencyRate | null> {
    const row = await this.repository.findOne({
      where: {
        baseCurrency: baseCurrency.toUpperCase(),
        targetCurrency: targetCurrency.toUpperCase(),
      },
    });
    return row ? toDomain(row) : null;
  }

  async upsertRates(
    baseCurrency: string,
    rates: Record<string, number>,
    syncedAt: Date,
  ): Promise<number> {
    const base = baseCurrency.toUpperCase();
    const entities = Object.entries(rates)
      .filter(([target]) => target.toUpperCase() !== base)
      .map(([targetCurrency, rate]) => {
        const entity = new CurrencyRateEntity();
        entity.baseCurrency = base;
        entity.targetCurrency = targetCurrency.toUpperCase();
        entity.rate = rate.toFixed(6);
        entity.syncedAt = syncedAt;
        return entity;
      });

    if (entities.length === 0) {
      return 0;
    }

    await this.repository.upsert(entities, ['baseCurrency', 'targetCurrency']);
    return entities.length;
  }
}
