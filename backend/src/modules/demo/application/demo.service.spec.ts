import { ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
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

  beforeEach(async () => {
    countEmployeesMock = jest.fn().mockResolvedValue(0);
    clearAllMock = jest.fn().mockResolvedValue(undefined);
    seedMock = jest.fn().mockResolvedValue({ inserted: 25 });
    updateSettingsMock = jest.fn().mockResolvedValue(DEFAULT_SETTINGS);

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
  });

  it('seed upserts settings defaults then seeds', async () => {
    const result = await service.seed('admin');
    expect(updateSettingsMock).toHaveBeenCalled();
    expect(seedMock).toHaveBeenCalledWith(25, 'admin');
    expect(result.inserted).toBe(25);
  });

  it('clear delegates to persistence', async () => {
    await expect(service.clear()).resolves.toEqual({ cleared: true });
    expect(clearAllMock).toHaveBeenCalled();
  });
});
