import { Module } from '@nestjs/common';
import { CurrencyRatesModule } from '../../modules/currency-rates/currency-rates.module';
import { CurrencyService } from './currency.service';

@Module({
  imports: [CurrencyRatesModule],
  providers: [CurrencyService],
  exports: [CurrencyService],
})
export class CurrencyModule {}
