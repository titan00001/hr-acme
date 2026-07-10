import { Test, TestingModule } from '@nestjs/testing';
import { CurrencyRateService } from '../../modules/currency-rates/application/currency-rate.service';
import { CurrencyService } from './currency.service';

describe('CurrencyService', () => {
  let service: CurrencyService;
  let getRateMock: jest.MockedFunction<CurrencyRateService['getRate']>;

  beforeEach(async () => {
    getRateMock = jest.fn() as jest.MockedFunction<
      CurrencyRateService['getRate']
    >;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurrencyService,
        {
          provide: CurrencyRateService,
          useValue: { getRate: getRateMock },
        },
      ],
    }).compile();

    service = module.get<CurrencyService>(CurrencyService);
  });

  it('returns same amount when currencies match', async () => {
    getRateMock.mockResolvedValue(1);
    await expect(service.normalize(100, 'usd', 'USD')).resolves.toBe(100);
  });

  it('throws for non-finite amount', async () => {
    await expect(service.normalize(Number.NaN, 'USD', 'USD')).rejects.toThrow(
      /finite number/i,
    );
  });

  it('converts amount using stored FX rate', async () => {
    getRateMock.mockResolvedValue(83);
    await expect(service.normalize(100, 'USD', 'INR')).resolves.toBe(8300);
  });
});
