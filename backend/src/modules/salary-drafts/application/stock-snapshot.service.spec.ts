import { Test, TestingModule } from '@nestjs/testing';
import { CurrencyService } from '../../../common/currency/currency.service';
import { SettingsService } from '../../settings/application/settings.service';
import { DEFAULT_SETTINGS } from '../../settings/domain/default-settings';
import { StockSnapshotService } from './stock-snapshot.service';

describe('StockSnapshotService', () => {
  let service: StockSnapshotService;
  let normalizeMock: jest.Mock;

  beforeEach(async () => {
    normalizeMock = jest.fn().mockResolvedValue(1_250_000);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockSnapshotService,
        {
          provide: SettingsService,
          useValue: {
            get: jest.fn().mockResolvedValue(DEFAULT_SETTINGS),
          },
        },
        {
          provide: CurrencyService,
          useValue: { normalize: normalizeMock },
        },
      ],
    }).compile();

    service = module.get(StockSnapshotService);
  });

  it('returns null snapshots when stock is absent', async () => {
    const snapshot = await service.capture(undefined, 'INR');
    expect(snapshot.stockPriceAtEntry).toBeNull();
    expect(normalizeMock).not.toHaveBeenCalled();
  });

  it('captures stock price and converted value', async () => {
    const snapshot = await service.capture({ quantity: 100 }, 'INR');

    expect(snapshot.stockPriceAtEntry).toBe('150.00');
    expect(snapshot.stockPriceCurrencyAtEntry).toBe('USD');
    expect(snapshot.stockValueInStockCurrency).toBe('15000.00');
    expect(snapshot.stockValueInSalaryCurrency).toBe('1250000.00');
    expect(snapshot.fxRateUsed).toBeTruthy();
    expect(normalizeMock).toHaveBeenCalledWith(15_000, 'USD', 'INR');
  });
});
