import { Test, TestingModule } from '@nestjs/testing';
import { CurrencyService } from '../../../common/currency/currency.service';
import { SettingsService } from '../../settings/application/settings.service';
import { DEFAULT_SETTINGS } from '../../settings/domain/default-settings';
import { DASHBOARD_QUERY } from '../ports/outbound/dashboard-query.port';
import {
  DASHBOARD_SNAPSHOT_REPOSITORY,
  type DashboardSnapshotRepositoryPort,
} from '../ports/outbound/dashboard-snapshot.repository.port';
import { DashboardSnapshotService } from './dashboard-snapshot.service';

describe('DashboardSnapshotService', () => {
  let service: DashboardSnapshotService;
  let adjustCountryMock: jest.MockedFunction<
    DashboardSnapshotRepositoryPort['adjustCountry']
  >;
  let adjustTrendMock: jest.MockedFunction<
    DashboardSnapshotRepositoryPort['adjustTrend']
  >;
  let adjustDistributionBucketMock: jest.MockedFunction<
    DashboardSnapshotRepositoryPort['adjustDistributionBucket']
  >;
  let replaceAllSnapshotsMock: jest.MockedFunction<
    DashboardSnapshotRepositoryPort['replaceAllSnapshots']
  >;
  let normalizeMock: jest.MockedFunction<CurrencyService['normalize']>;

  beforeEach(async () => {
    adjustCountryMock = jest.fn().mockResolvedValue(undefined);
    adjustTrendMock = jest.fn().mockResolvedValue(undefined);
    adjustDistributionBucketMock = jest.fn().mockResolvedValue(undefined);
    replaceAllSnapshotsMock = jest.fn().mockResolvedValue(undefined);
    normalizeMock = jest.fn((amount: number, from: string, to: string) => {
      if (from === to) {
        return Promise.resolve(amount);
      }
      if (from === 'INR' && to === 'USD') {
        return Promise.resolve(amount / 80);
      }
      return Promise.resolve(amount);
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardSnapshotService,
        {
          provide: DASHBOARD_SNAPSHOT_REPOSITORY,
          useValue: {
            adjustCountry: adjustCountryMock,
            adjustTrend: adjustTrendMock,
            adjustDistributionBucket: adjustDistributionBucketMock,
            replaceAllSnapshots: replaceAllSnapshotsMock,
          },
        },
        {
          provide: DASHBOARD_QUERY,
          useValue: {
            findActiveCurrentSalaries: jest.fn().mockResolvedValue([
              {
                employeeId: 'e1',
                country: 'India',
                currency: 'INR',
                totalCompensation: '800000.00',
                recordId: 'r1',
              },
            ]),
            findActiveHeadcountByCountry: jest
              .fn()
              .mockResolvedValue([{ country: 'India', headcount: 2 }]),
            findActiveCommittedInRange: jest.fn().mockResolvedValue([
              {
                effectiveDate: '2026-02-01',
                currency: 'INR',
                totalCompensation: '800000.00',
              },
            ]),
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

    service = module.get(DashboardSnapshotService);
  });

  it('onSalaryCommitted upserts country/trend and increments bucket', async () => {
    await service.onSalaryCommitted({
      country: 'India',
      effectiveDate: '2026-02-01',
      newCurrency: 'INR',
      newTotalCompensation: '800000.00',
    });

    expect(adjustCountryMock).toHaveBeenCalledWith('India', 'USD', 10000, 0);
    expect(adjustTrendMock).toHaveBeenCalledWith('2026-02-01', 'USD', 10000);
    expect(adjustDistributionBucketMock).toHaveBeenCalledWith(0, 1);
  });

  it('onSalaryCommitted moves distribution bucket on revision', async () => {
    await service.onSalaryCommitted({
      country: 'US',
      effectiveDate: '2026-03-01',
      newCurrency: 'USD',
      newTotalCompensation: '150000.00',
      previousCurrency: 'USD',
      previousTotalCompensation: '40000.00',
    });

    expect(adjustCountryMock).toHaveBeenCalledWith('US', 'USD', 110000, 0);
    expect(adjustDistributionBucketMock).toHaveBeenCalledWith(0, -1);
    expect(adjustDistributionBucketMock).toHaveBeenCalledWith(2, 1);
  });

  it('onEmployeeRelieved decrements headcount payroll and bucket', async () => {
    await service.onEmployeeRelieved({
      country: 'US',
      currency: 'USD',
      totalCompensation: '75000.00',
    });

    expect(adjustCountryMock).toHaveBeenCalledWith('US', 'USD', -75000, -1);
    expect(adjustDistributionBucketMock).toHaveBeenCalledWith(1, -1);
  });

  it('reconcile replaces snapshots from source rows', async () => {
    const result = await service.reconcile();

    expect(replaceAllSnapshotsMock).toHaveBeenCalledWith({
      countries: [
        {
          country: 'India',
          baseCurrency: 'USD',
          totalPayroll: 10000,
          headcount: 2,
        },
      ],
      trends: [
        {
          effectiveDate: '2026-02-01',
          baseCurrency: 'USD',
          totalPayroll: 10000,
        },
      ],
      distributionCounts: [1, 0, 0, 0, 0],
    });
    expect(result).toEqual({ countries: 1, trends: 1 });
  });
});
