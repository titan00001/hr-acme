import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsModule } from '../settings/settings.module';
import { CurrencyRateService } from './application/currency-rate.service';
import { CurrencyRatesController } from './adapters/inbound/currency-rates.controller';
import { CurrencyRateEntity } from './adapters/outbound/currency-rate.entity';
import { ExchangeRateApiAdapter } from './adapters/outbound/exchange-rate-api.adapter';
import { TypeOrmCurrencyRateRepository } from './adapters/outbound/typeorm-currency-rate.repository';
import { CURRENCY_RATE_REPOSITORY } from './ports/outbound/currency-rate.repository.port';
import { EXCHANGE_RATE_PORT } from './ports/outbound/exchange-rate.port';

@Module({
  imports: [TypeOrmModule.forFeature([CurrencyRateEntity]), SettingsModule],
  controllers: [CurrencyRatesController],
  providers: [
    CurrencyRateService,
    TypeOrmCurrencyRateRepository,
    ExchangeRateApiAdapter,
    {
      provide: CURRENCY_RATE_REPOSITORY,
      useExisting: TypeOrmCurrencyRateRepository,
    },
    {
      provide: EXCHANGE_RATE_PORT,
      useClass: ExchangeRateApiAdapter,
    },
  ],
  exports: [CurrencyRateService, CURRENCY_RATE_REPOSITORY],
})
export class CurrencyRatesModule {}
