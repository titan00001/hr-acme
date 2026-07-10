import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CurrencyService } from '../../../common/currency/currency.service';
import { SettingsService } from '../../settings/application/settings.service';
import { DEFAULT_SETTINGS } from '../../settings/domain/default-settings';
import {
  DASHBOARD_QUERY,
  type DashboardQueryPort,
} from '../ports/outbound/dashboard-query.port';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let findActiveCurrentSalariesMock: jest.MockedFunction<
    DashboardQueryPort['findActiveCurrentSalaries']
  >;
  let findActiveCommittedInRangeMock: jest.MockedFunction<
    DashboardQueryPort['findActiveCommittedInRange']
  >;
  let findRecentRevisionsMock: jest.MockedFunction<
    DashboardQueryPort['findRecentRevisions']
  >;
  let normalizeMock: jest.MockedFunction<CurrencyService['normalize']>;

  beforeEach(async () => {
    findActiveCurrentSalariesMock = jest.fn();
    findActiveCommittedInRangeMock = jest.fn();
    findRecentRevisionsMock = jest.fn();
    normalizeMock = jest.fn((amount: number, from: string, to: string) => {
      if (from === to) {
        return Promise.resolve(amount);
      }
      if (from === 'INR' && to === 'USD') {
        return Promise.resolve(amount / 80);
      }
      return Promise.resolve(amount);
    });

    findActiveCurrentSalariesMock.mockResolvedValue([
      {
        employeeId: 'e1',
        country: 'India',
        currency: 'INR',
        totalCompensation: '800000.00',
        recordId: 'r1',
      },
      {
        employeeId: 'e2',
        country: 'US',
        currency: 'USD',
        totalCompensation: '100000.00',
        recordId: 'r2',
      },
    ]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: DASHBOARD_QUERY,
          useValue: {
            findActiveCurrentSalaries: findActiveCurrentSalariesMock,
            findActiveCommittedInRange: findActiveCommittedInRangeMock,
            findRecentRevisions: findRecentRevisionsMock,
          },
        },
        {
          provide: CurrencyService,
          useValue: { normalize: normalizeMock },
        },
        {
          provide: SettingsService,
          useValue: {
            getCurrencies: jest
              .fn()
              .mockResolvedValue(DEFAULT_SETTINGS.supportedCurrencies),
          },
        },
      ],
    }).compile();

    service = module.get(DashboardService);
  });

  it('summary original returns per-currency breakdown', async () => {
    const summary = await service.getSummary({ displayCurrency: 'original' });
    expect(summary.totalPayroll).toBeNull();
    expect(summary.byCurrency).toHaveLength(2);
    expect(summary.activeEmployeeCount).toBe(2);
  });

  it('summary USD converts and blends totals', async () => {
    const summary = await service.getSummary({ displayCurrency: 'USD' });
    expect(summary.totalPayroll).toBe(110000);
    expect(summary.averageCompensation).toBe(55000);
    expect(normalizeMock).toHaveBeenCalled();
  });

  it('rejects unsupported displayCurrency', async () => {
    await expect(
      service.getSummary({ displayCurrency: 'JPY' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('trends filters by date range', async () => {
    findActiveCommittedInRangeMock.mockResolvedValue([
      {
        effectiveDate: '2026-02-01',
        currency: 'USD',
        totalCompensation: '100.00',
      },
    ]);

    const trends = await service.getTrends({
      displayCurrency: 'USD',
      from: '2026-01-01',
      to: '2026-03-01',
    });

    expect(findActiveCommittedInRangeMock).toHaveBeenCalledWith(
      '2026-01-01',
      '2026-03-01',
    );
    expect(trends).toEqual([
      { date: '2026-02-01', totalPayroll: 100, currency: 'USD' },
    ]);
  });
});
