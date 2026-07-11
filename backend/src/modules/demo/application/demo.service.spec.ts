import { ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { CurrencyRateService } from '../../currency-rates/application/currency-rate.service';
import { DashboardSnapshotService } from '../../dashboard/application/dashboard-snapshot.service';
import { SettingsService } from '../../settings/application/settings.service';
import { DEFAULT_SETTINGS } from '../../settings/domain/default-settings';
import { DEMO_PERSISTENCE } from '../ports/outbound/demo-persistence.port';
import { DemoService } from './demo.service';

describe('DemoService', () => {
  let service: DemoService;
  let countEmployeesMock: jest.Mock;
  let clearAllMock: jest.Mock;
  let seedMock: jest.Mock;
  let updateSettingsMock: jest.Mock;
  let syncRatesMock: jest.Mock;
  let reconcileMock: jest.Mock;

  beforeEach(async () => {
    countEmployeesMock = jest.fn().mockResolvedValue(0);
    clearAllMock = jest.fn().mockResolvedValue(undefined);
    seedMock = jest.fn().mockResolvedValue({ inserted: 25 });
    updateSettingsMock = jest.fn().mockResolvedValue(DEFAULT_SETTINGS);
    syncRatesMock = jest
      .fn()
      .mockResolvedValue({ synced: 4, lastFxSyncAt: new Date() });
    reconcileMock = jest.fn().mockResolvedValue({ countries: 5, trends: 10 });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DemoService,
        {
          provide: DEMO_PERSISTENCE,
          useValue: {
            countEmployees: countEmployeesMock,
            clearAll: clearAllMock,
            seed: seedMock,
          },
        },
        {
          provide: SettingsService,
          useValue: { update: updateSettingsMock },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('25'),
          },
        },
        {
          provide: CurrencyRateService,
          useValue: { sync: syncRatesMock },
        },
        {
          provide: DashboardSnapshotService,
          useValue: { reconcile: reconcileMock },
        },
      ],
    }).compile();

    service = module.get(DemoService);
  });

  it('getStatus reports seeded when employees exist', async () => {
    countEmployeesMock.mockResolvedValue(10);
    await expect(service.getStatus()).resolves.toEqual({
      seeded: true,
      employeeCount: 10,
    });
  });

  it('seed rejects when data already exists', async () => {
    countEmployeesMock.mockResolvedValue(3);
    await expect(service.seed('admin')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(seedMock).not.toHaveBeenCalled();
    expect(reconcileMock).not.toHaveBeenCalled();
  });

  it('seed upserts settings defaults then seeds and reconciles', async () => {
    const result = await service.seed('admin');
    expect(updateSettingsMock).toHaveBeenCalled();
    expect(seedMock).toHaveBeenCalledWith(25, 'admin');
    expect(syncRatesMock).toHaveBeenCalled();
    expect(reconcileMock).toHaveBeenCalled();
    expect(result.inserted).toBe(25);
  });

  it('clear clears data then reconciles snapshots', async () => {
    await expect(service.clear()).resolves.toEqual({ cleared: true });
    expect(clearAllMock).toHaveBeenCalled();
    expect(reconcileMock).toHaveBeenCalled();
  });
});
