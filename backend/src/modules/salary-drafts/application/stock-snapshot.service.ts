import { Injectable } from '@nestjs/common';
import { CurrencyService } from '../../../common/currency/currency.service';
import { SettingsService } from '../../settings/application/settings.service';
import type { SalaryStockComponent } from '../../salary/domain/salary-components';
import {
  parseMoney,
  toMoneyString,
  toRateString,
} from '../../salary/application/compute-total-compensation';
import type { StockSnapshot } from '../domain/salary-draft.model';

@Injectable()
export class StockSnapshotService {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly currencyService: CurrencyService,
  ) {}

  async capture(
    stock: SalaryStockComponent | undefined,
    salaryCurrency: string,
  ): Promise<StockSnapshot> {
    if (!stock || stock.quantity <= 0) {
      return {
        stockPriceAtEntry: null,
        stockPriceCurrencyAtEntry: null,
        stockValueInStockCurrency: null,
        stockValueInSalaryCurrency: null,
        fxRateUsed: null,
      };
    }

    const settings = await this.settingsService.get();
    const stockPrice = parseMoney(settings.stockPrice);
    const stockCurrency = settings.stockPriceCurrency.toUpperCase();
    const targetCurrency = salaryCurrency.toUpperCase();
    const stockValueInStockCurrency = stock.quantity * stockPrice;

    const stockValueInSalaryCurrency = await this.currencyService.normalize(
      stockValueInStockCurrency,
      stockCurrency,
      targetCurrency,
    );

    const fxRateUsed =
      stockCurrency === targetCurrency
        ? 1
        : stockValueInSalaryCurrency / stockValueInStockCurrency;

    return {
      stockPriceAtEntry: toMoneyString(stockPrice),
      stockPriceCurrencyAtEntry: stockCurrency,
      stockValueInStockCurrency: toMoneyString(stockValueInStockCurrency),
      stockValueInSalaryCurrency: toMoneyString(stockValueInSalaryCurrency),
      fxRateUsed: toRateString(fxRateUsed),
    };
  }
}
