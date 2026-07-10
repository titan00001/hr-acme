import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from '../../settings/application/settings.service';
import { DEFAULT_SETTINGS } from '../../settings/domain/default-settings';
import type { CurrencyRate } from '../domain/currency-rate.model';
import {
  CURRENCY_RATE_REPOSITORY,
  type CurrencyRateRepositoryPort,
} from '../ports/outbound/currency-rate.repository.port';
import {
  EXCHANGE_RATE_PORT,
  type ExchangeRatePort,
} from '../ports/outbound/exchange-rate.port';
import { CurrencyRateService } from './currency-rate.service';

describe('CurrencyRateService', () => {
  let service: CurrencyRateService;
  let findAllMock: jest.MockedFunction<CurrencyRateRepositoryPort['findAll']>;
  let findRateMock: jest.MockedFunction<CurrencyRateRepositoryPort['findRate']>;
  let upsertRatesMock: jest.MockedFunction<
    CurrencyRateRepositoryPort['upsertRates']
  >;
  let fetchLatestRatesMock: jest.MockedFunction<
    ExchangeRatePort['fetchLatestRates']
  >;
  let getSettingsMock: jest.MockedFunction<SettingsService['get']>;
  let setLastFxSyncAtMock: jest.MockedFunction<
    SettingsService['setLastFxSyncAt']
  >;

  const sampleRate: CurrencyRate = {
    id: 'rate-1',
    baseCurrency: 'USD',
    targetCurrency: 'INR',
    rate: '83.000000',
    syncedAt: new Date('2026-07-09T00:00:00.000Z'),
  };

  beforeEach(async () => {
    findAllMock = jest.fn() as jest.MockedFunction<
      CurrencyRateRepositoryPort['findAll']
    >;
    findRateMock = jest.fn() as jest.MockedFunction<
      CurrencyRateRepositoryPort['findRate']
    >;
    upsertRatesMock = jest.fn() as jest.MockedFunction<
      CurrencyRateRepositoryPort['upsertRates']
    >;
    fetchLatestRatesMock = jest.fn() as jest.MockedFunction<
      ExchangeRatePort['fetchLatestRates']
    >;
    getSettingsMock = jest.fn() as jest.MockedFunction<SettingsService['get']>;
    setLastFxSyncAtMock = jest.fn() as jest.MockedFunction<
      SettingsService['setLastFxSyncAt']
    >;

    getSettingsMock.mockResolvedValue(DEFAULT_SETTINGS);
    setLastFxSyncAtMock.mockImplementation((syncedAt: Date) =>
      Promise.resolve({ ...DEFAULT_SETTINGS, lastFxSyncAt: syncedAt }),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurrencyRateService,
        {
          provide: CURRENCY_RATE_REPOSITORY,
          useValue: {
            findAll: findAllMock,
            findRate: findRateMock,
            upsertRates: upsertRatesMock,
          },
        },
        {
          provide: EXCHANGE_RATE_PORT,
          useValue: { fetchLatestRates: fetchLatestRatesMock },
        },
        {
          provide: SettingsService,
          useValue: {
            get: getSettingsMock,
            setLastFxSyncAt: setLastFxSyncAtMock,
          },
        },
      ],
    }).compile();

    service = module.get<CurrencyRateService>(CurrencyRateService);
  });

  it('syncs rates and updates lastFxSyncAt', async () => {
    fetchLatestRatesMock.mockResolvedValue({ USD: 1, INR: 83 });
    upsertRatesMock.mockResolvedValue(1);

    const result = await service.sync();

    expect(fetchLatestRatesMock).toHaveBeenCalledWith('USD');
    expect(upsertRatesMock).toHaveBeenCalled();
    expect(setLastFxSyncAtMock).toHaveBeenCalled();
    expect(result.synced).toBe(1);
    expect(result.lastFxSyncAt).toBeInstanceOf(Date);
  });

  it('returns conversion rate via base currency', async () => {
    findRateMock.mockResolvedValue(sampleRate);

    await expect(service.getRate('USD', 'INR')).resolves.toBe(83);
    await expect(service.getRate('INR', 'USD')).resolves.toBeCloseTo(1 / 83);
  });

  it('returns 1 for identical currencies', async () => {
    await expect(service.getRate('USD', 'USD')).resolves.toBe(1);
    expect(findRateMock).not.toHaveBeenCalled();
  });
});
