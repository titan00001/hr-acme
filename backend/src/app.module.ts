import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/auth/jwt-auth.guard';
import { DatabaseModule } from './common/database/database.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { CurrencyRatesModule } from './modules/currency-rates/currency-rates.module';
import { SettingsModule } from './modules/settings/settings.module';
import { CurrencyModule } from './common/currency/currency.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    SettingsModule,
    CurrencyRatesModule,
    CurrencyModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
