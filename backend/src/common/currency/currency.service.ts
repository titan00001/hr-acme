import { Injectable } from '@nestjs/common';
import { CurrencyRateService } from '../../modules/currency-rates/application/currency-rate.service';

@Injectable()
export class CurrencyService {
  constructor(private readonly currencyRateService: CurrencyRateService) {}

  async normalize(amount: number, from: string, to: string): Promise<number> {
    if (!Number.isFinite(amount)) {
      throw new Error('Amount must be a finite number');
    }

    const rate = await this.currencyRateService.getRate(from, to);
    return amount * rate;
  }
}
