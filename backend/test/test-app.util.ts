import { Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { DatabaseModule } from '../src/common/database/database.module';
import { CurrencyRatesController } from '../src/modules/currency-rates/adapters/inbound/currency-rates.controller';
import { CurrencyRateService } from '../src/modules/currency-rates/application/currency-rate.service';
import { CURRENCY_RATE_REPOSITORY } from '../src/modules/currency-rates/ports/outbound/currency-rate.repository.port';
import { EXCHANGE_RATE_PORT } from '../src/modules/currency-rates/ports/outbound/exchange-rate.port';
import { CurrencyRatesModule } from '../src/modules/currency-rates/currency-rates.module';
import { SettingsController } from '../src/modules/settings/adapters/inbound/settings.controller';
import { SettingsService } from '../src/modules/settings/application/settings.service';
import { SETTINGS_REPOSITORY } from '../src/modules/settings/ports/outbound/settings.repository.port';
import { SettingsModule } from '../src/modules/settings/settings.module';
import { InMemoryCurrencyRateRepository } from './mocks/in-memory-currency-rate.repository';
import { InMemorySettingsRepository } from './mocks/in-memory-settings.repository';
import { MockExchangeRatePort } from './mocks/mock-exchange-rate.port';

@Module({})
export class MockDatabaseModule {}

export const sharedSettingsRepository = new InMemorySettingsRepository();
export const sharedCurrencyRateRepository =
  new InMemoryCurrencyRateRepository();
export const sharedExchangeRatePort = new MockExchangeRatePort();

@Module({
  controllers: [SettingsController],
  providers: [
    SettingsService,
    {
      provide: SETTINGS_REPOSITORY,
      useValue: sharedSettingsRepository,
    },
  ],
  exports: [SettingsService, SETTINGS_REPOSITORY],
})
export class TestSettingsModule {}

@Module({
  controllers: [CurrencyRatesController],
  providers: [
    SettingsService,
    {
      provide: SETTINGS_REPOSITORY,
      useValue: sharedSettingsRepository,
    },
    CurrencyRateService,
    {
      provide: CURRENCY_RATE_REPOSITORY,
      useValue: sharedCurrencyRateRepository,
    },
    {
      provide: EXCHANGE_RATE_PORT,
      useValue: sharedExchangeRatePort,
    },
  ],
  exports: [CurrencyRateService, CURRENCY_RATE_REPOSITORY, EXCHANGE_RATE_PORT],
})
export class TestCurrencyRatesModule {}

export function createTestModuleBuilder() {
  return Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideModule(DatabaseModule)
    .useModule(MockDatabaseModule)
    .overrideModule(SettingsModule)
    .useModule(TestSettingsModule)
    .overrideModule(CurrencyRatesModule)
    .useModule(TestCurrencyRatesModule);
}

export async function createTestModule(): Promise<TestingModule> {
  return createTestModuleBuilder().compile();
}
