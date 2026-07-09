import { Injectable } from '@nestjs/common';

@Injectable()
export class CurrencyService {
  normalize(amount: number, from: string, to: string): number {
    if (!Number.isFinite(amount)) {
      throw new Error('Amount must be a finite number');
    }

    const fromCode = from.toUpperCase();
    const toCode = to.toUpperCase();

    if (fromCode === toCode) {
      return amount;
    }

    // Stub implementation for M1.1: no FX conversion yet.
    // Real implementation will use currency_rates table in a later milestone.
    return amount;
  }
}
