import { Test, TestingModule } from '@nestjs/testing';
import { DEFAULT_SETTINGS } from '../domain/default-settings';
import { SETTINGS_ID } from '../domain/settings.model';
import type { Settings } from '../domain/settings.model';
import {
  SETTINGS_REPOSITORY,
  type SettingsRepositoryPort,
} from '../ports/outbound/settings.repository.port';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  let service: SettingsService;
  let findByIdMock: jest.MockedFunction<SettingsRepositoryPort['findById']>;
  let saveMock: jest.MockedFunction<SettingsRepositoryPort['save']>;

  beforeEach(async () => {
    findByIdMock = jest.fn() as jest.MockedFunction<
      SettingsRepositoryPort['findById']
    >;
    saveMock = jest.fn() as jest.MockedFunction<SettingsRepositoryPort['save']>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        {
          provide: SETTINGS_REPOSITORY,
          useValue: {
            findById: findByIdMock,
            save: saveMock,
          },
        },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
  });

  it('returns defaults when settings row is missing', async () => {
    findByIdMock.mockResolvedValue(null);
    saveMock.mockImplementation((settings: Settings) =>
      Promise.resolve(settings),
    );

    const settings = await service.get();

    expect(settings).toEqual(DEFAULT_SETTINGS);
    expect(saveMock).toHaveBeenCalledWith(DEFAULT_SETTINGS);
  });

  it('uses in-memory cache after first load', async () => {
    findByIdMock.mockResolvedValue(DEFAULT_SETTINGS);

    await service.get();
    await service.get();

    expect(findByIdMock).toHaveBeenCalledTimes(1);
  });

  it('partially updates settings and refreshes cache', async () => {
    findByIdMock.mockResolvedValue(DEFAULT_SETTINGS);
    saveMock.mockImplementation((settings: Settings) =>
      Promise.resolve(settings),
    );

    await service.get();
    const updated = await service.update({ stockPrice: 200 });

    expect(updated.stockPrice).toBe('200.00');
    expect(saveMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: SETTINGS_ID,
        stockPrice: '200.00',
        baseCurrency: DEFAULT_SETTINGS.baseCurrency,
      }),
    );

    findByIdMock.mockClear();
    const cached = await service.get();
    expect(cached.stockPrice).toBe('200.00');
    expect(findByIdMock).not.toHaveBeenCalled();
  });
});
