import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DEFAULT_SETTINGS } from '../../settings/domain/default-settings';
import { SettingsService } from '../../settings/application/settings.service';
import {
  DEMO_PERSISTENCE,
  type DemoPersistencePort,
} from '../ports/outbound/demo-persistence.port';

export interface DemoStatus {
  seeded: boolean;
  employeeCount: number;
}

export interface DemoSeedResponse {
  inserted: number;
}

@Injectable()
export class DemoService {
  private readonly logger = new Logger(DemoService.name);

  constructor(
    @Inject(DEMO_PERSISTENCE)
    private readonly demoPersistence: DemoPersistencePort,
    private readonly settingsService: SettingsService,
    private readonly configService: ConfigService,
  ) {}

  async getStatus(): Promise<DemoStatus> {
    const employeeCount = await this.demoPersistence.countEmployees();
    return {
      seeded: employeeCount > 0,
      employeeCount,
    };
  }

  async seed(createdBy: string): Promise<DemoSeedResponse> {
    const employeeCount = await this.demoPersistence.countEmployees();
    if (employeeCount > 0) {
      throw new ConflictException(
        'Demo data already exists; clear before seeding again',
      );
    }

    await this.settingsService.update({
      baseCurrency: DEFAULT_SETTINGS.baseCurrency,
      supportedCurrencies: DEFAULT_SETTINGS.supportedCurrencies,
      supportedCountries: DEFAULT_SETTINGS.supportedCountries,
      totalStocks: DEFAULT_SETTINGS.totalStocks,
      stockPrice: Number(DEFAULT_SETTINGS.stockPrice),
      stockPriceCurrency: DEFAULT_SETTINGS.stockPriceCurrency,
    });

    const targetCount = this.resolveSeedCount();
    this.logger.log(`Seeding demo data: ${targetCount} employees`);
    const result = await this.demoPersistence.seed(targetCount, createdBy);
    this.logger.log(`Demo seed completed: inserted=${result.inserted}`);
    return result;
  }

  async clear(): Promise<{ cleared: true }> {
    await this.demoPersistence.clearAll();
    this.logger.log('Demo data cleared; settings preserved');
    return { cleared: true };
  }

  private resolveSeedCount(): number {
    const raw = this.configService.get<string | number>('DEMO_SEED_COUNT');
    if (raw === undefined || raw === null || raw === '') {
      return 10_000;
    }
    const parsed = typeof raw === 'number' ? raw : Number(raw);
    if (!Number.isFinite(parsed) || parsed < 1) {
      return 10_000;
    }
    return Math.floor(parsed);
  }
}
