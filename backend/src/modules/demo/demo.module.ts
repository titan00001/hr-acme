import { Module } from '@nestjs/common';
import { CurrencyRatesModule } from '../currency-rates/currency-rates.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { SettingsModule } from '../settings/settings.module';
import { DemoController } from './adapters/inbound/demo.controller';
import { TypeOrmDemoPersistenceAdapter } from './adapters/outbound/typeorm-demo-persistence.adapter';
import { DemoService } from './application/demo.service';
import { DEMO_PERSISTENCE } from './ports/outbound/demo-persistence.port';

@Module({
  imports: [SettingsModule, CurrencyRatesModule, DashboardModule],
  controllers: [DemoController],
  providers: [
    DemoService,
    TypeOrmDemoPersistenceAdapter,
    {
      provide: DEMO_PERSISTENCE,
      useExisting: TypeOrmDemoPersistenceAdapter,
    },
  ],
  exports: [DemoService],
})
export class DemoModule {}
