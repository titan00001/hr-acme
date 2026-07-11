import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CurrencyService } from '../../../common/currency/currency.service';
import { SettingsService } from '../../settings/application/settings.service';
import { DEFAULT_SETTINGS } from '../../settings/domain/default-settings';
import { DASHBOARD_QUERY } from '../ports/outbound/dashboard-query.port';
import { DASHBOARD_SNAPSHOT_REPOSITORY } from '../ports/outbound/dashboard-snapshot.repository.port';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let findAllCountrySnapshotsMock: jest.Mock;
  let findTrendSnapshotsMock: jest.Mock;
  let findAllDistributionSnapshotsMock: jest.Mock;
  let findRecentRevisionsMock: jest.Mock;
  let normalizeMock: jest.MockedFunction<CurrencyService['normalize']>;

  beforeEach(async () => {
    findAllCountrySnapshotsMock = jest.fn().mockResolvedValue([
      {
        country: 'India',
        baseCurrency: 'USD',
        totalPayroll: '10000.0000',
        headcount: 1,
        updatedAt: new Date(),
      },
      {
        country: 'US',
        baseCurrency: 'USD',
        totalPayroll: '100000.0000',
        headcount: 1,
        updatedAt: new Date(),
      },
    ]);
    findTrendSnapshotsMock = jest.fn().mockResolvedValue([
      {
        effectiveDate: '2026-02-01',
        baseCurrency: 'USD',
        totalPayroll: '100.0000',
        updatedAt: new Date(),
      },
    ]);
    findAllDistributionSnapshotsMock = jest.fn().mockResolvedValue([
      {
        bucketIndex: 0,
        label: '0–50k',
        lowerBound: '0.0000',
        upperBound: '50000.0000',
        count: 2,
        updatedAt: new Date(),
      },
    ]);
    findRecentRevisionsMock = jest.fn();
    normalizeMock = jest.fn((amount: number, from: string, to: string) => {
      if (from === to) {
        return Promise.resolve(amount);
      }
      if (from === 'USD' && to === 'INR') {
        return Promise.resolve(amount * 80);
      }
      return Promise.resolve(amount);
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: DASHBOARD_SNAPSHOT_REPOSITORY,
          useValue: {
            findAllCountrySnapshots: findAllCountrySnapshotsMock,
            findTrendSnapshots: findTrendSnapshotsMock,
            findAllDistributionSnapshots: findAllDistributionSnapshotsMock,
          },
        },
        {
          provide: DASHBOARD_QUERY,
          useValue: {
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
            get: jest.fn().mockResolvedValue(DEFAULT_SETTINGS),
          },
        },
      ],
    }).compile();

    service = module.get(DashboardService);
  });

  it('summary original returns base-currency breakdown without FX', async () => {
    const summary = await service.getSummary({ displayCurrency: 'original' });
    expect(summary.totalPayroll).toBeNull();
    expect(summary.activeEmployeeCount).toBe(2);
    expect(summary.byCurrency).toEqual([
      {
        currency: 'USD',
        employeeCount: 2,
        totalPayroll: 110000,
        averageCompensation: 55000,
      },
    ]);
    expect(normalizeMock).not.toHaveBeenCalled();
  });

  it('summary INR applies a single FX multiply', async () => {
    const summary = await service.getSummary({ displayCurrency: 'INR' });
    expect(summary.totalPayroll).toBe(8_800_000);
    expect(summary.averageCompensation).toBe(4_400_000);
    expect(normalizeMock).toHaveBeenCalledWith(1, 'USD', 'INR');
  });

  it('rejects unsupported displayCurrency', async () => {
    await expect(
      service.getSummary({ displayCurrency: 'JPY' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('trends reads snapshot range', async () => {
    const trends = await service.getTrends({
      displayCurrency: 'USD',
      from: '2026-01-01',
      to: '2026-03-01',
    });

    expect(findTrendSnapshotsMock).toHaveBeenCalledWith(
      '2026-01-01',
      '2026-03-01',
    );
    expect(trends).toEqual([
      { date: '2026-02-01', totalPayroll: 100, currency: 'USD' },
    ]);
  });

  it('distribution scales labels by FX rate', async () => {
    const buckets = await service.getDistribution({ displayCurrency: 'INR' });
    expect(buckets[0]?.count).toBe(2);
    expect(buckets[0]?.range).toContain('INR');
  });

  it('recent revisions returns pagination meta', async () => {
    findRecentRevisionsMock.mockResolvedValue({
      total: 25,
      data: [
        {
          id: 'r1',
          employeeId: 'e1',
          employeeName: 'Ada',
          employeeCode: 'E001',
          effectiveDate: '2026-04-01',
          currency: 'INR',
          totalCompensation: '100.00',
          reason: null,
          createdBy: 'admin',
          createdAt: new Date('2026-04-01T00:00:00.000Z'),
        },
      ],
    });

    const result = await service.getRecentRevisions({ page: 2, limit: 10 });

    expect(findRecentRevisionsMock).toHaveBeenCalledWith(2, 10);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
    expect(result.total).toBe(25);
    expect(result.totalPages).toBe(3);
    expect(result.data).toHaveLength(1);
  });
});
