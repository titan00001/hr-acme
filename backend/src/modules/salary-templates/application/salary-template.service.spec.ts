import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from '../../settings/application/settings.service';
import { DEFAULT_SETTINGS } from '../../settings/domain/default-settings';
import type { SalaryTemplate } from '../domain/salary-template.model';
import {
  SALARY_TEMPLATE_REPOSITORY,
  type SalaryTemplateRepositoryPort,
} from '../ports/outbound/salary-template.repository.port';
import { SalaryTemplateService } from './salary-template.service';

describe('SalaryTemplateService', () => {
  let service: SalaryTemplateService;
  let findByIdMock: jest.MockedFunction<
    SalaryTemplateRepositoryPort['findById']
  >;
  let findByNameAndVersionMock: jest.MockedFunction<
    SalaryTemplateRepositoryPort['findByNameAndVersion']
  >;
  let findLatestByNameMock: jest.MockedFunction<
    SalaryTemplateRepositoryPort['findLatestByName']
  >;
  let findMaxVersionByNameMock: jest.MockedFunction<
    SalaryTemplateRepositoryPort['findMaxVersionByName']
  >;
  let findManyMock: jest.MockedFunction<
    SalaryTemplateRepositoryPort['findMany']
  >;
  let saveMock: jest.MockedFunction<SalaryTemplateRepositoryPort['save']>;
  let updateMock: jest.MockedFunction<SalaryTemplateRepositoryPort['update']>;
  let deleteMock: jest.MockedFunction<SalaryTemplateRepositoryPort['delete']>;
  let getCountriesMock: jest.MockedFunction<SettingsService['getCountries']>;
  let getCurrenciesMock: jest.MockedFunction<SettingsService['getCurrencies']>;

  const sampleTemplate: SalaryTemplate = {
    id: 'tpl-1',
    name: 'India Standard',
    version: 1,
    country: 'India',
    currency: 'INR',
    components: { basePay: 1_200_000, allowances: 50_000 },
    isAssigned: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    findByIdMock = jest.fn();
    findByNameAndVersionMock = jest.fn();
    findLatestByNameMock = jest.fn();
    findMaxVersionByNameMock = jest.fn();
    findManyMock = jest.fn();
    saveMock = jest.fn();
    updateMock = jest.fn();
    deleteMock = jest.fn();
    getCountriesMock = jest.fn();
    getCurrenciesMock = jest.fn();

    getCountriesMock.mockResolvedValue(DEFAULT_SETTINGS.supportedCountries);
    getCurrenciesMock.mockResolvedValue(DEFAULT_SETTINGS.supportedCurrencies);
    findByNameAndVersionMock.mockResolvedValue(null);
    saveMock.mockImplementation((template) => Promise.resolve(template));
    updateMock.mockImplementation((template) => Promise.resolve(template));
    deleteMock.mockResolvedValue(undefined);
    findMaxVersionByNameMock.mockResolvedValue(1);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalaryTemplateService,
        {
          provide: SALARY_TEMPLATE_REPOSITORY,
          useValue: {
            findById: findByIdMock,
            findByNameAndVersion: findByNameAndVersionMock,
            findLatestByName: findLatestByNameMock,
            findMaxVersionByName: findMaxVersionByNameMock,
            findMany: findManyMock,
            save: saveMock,
            update: updateMock,
            delete: deleteMock,
          },
        },
        {
          provide: SettingsService,
          useValue: {
            getCountries: getCountriesMock,
            getCurrencies: getCurrenciesMock,
          },
        },
      ],
    }).compile();

    service = module.get(SalaryTemplateService);
  });

  it('creates version 1 of a new template family', async () => {
    const created = await service.create({
      name: 'India Standard',
      country: 'India',
      currency: 'INR',
      components: { basePay: 1_200_000 },
    });

    expect(created.version).toBe(1);
    expect(created.isAssigned).toBe(false);
    expect(saveMock).toHaveBeenCalled();
  });

  it('rejects duplicate family create', async () => {
    findByNameAndVersionMock.mockResolvedValue(sampleTemplate);

    await expect(
      service.create({
        name: 'India Standard',
        country: 'India',
        currency: 'INR',
        components: { basePay: 1_200_000 },
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates next version from an existing template', async () => {
    findByIdMock.mockResolvedValue(sampleTemplate);
    findMaxVersionByNameMock.mockResolvedValue(1);

    const created = await service.createVersion('tpl-1', {
      name: 'India Standard',
      country: 'India',
      currency: 'INR',
      components: { basePay: 1_400_000 },
    });

    expect(created.version).toBe(2);
    expect(created.components.basePay).toBe(1_400_000);
  });

  it('creates next version when name is omitted', async () => {
    findByIdMock.mockResolvedValue(sampleTemplate);
    findMaxVersionByNameMock.mockResolvedValue(1);

    const created = await service.createVersion('tpl-1', {
      country: 'India',
      currency: 'INR',
      components: { basePay: 1_500_000 },
    });

    expect(created.version).toBe(2);
    expect(created.name).toBe('India Standard');
  });

  it('rejects edit when template is assigned', async () => {
    findByIdMock.mockResolvedValue({ ...sampleTemplate, isAssigned: true });

    await expect(
      service.update('tpl-1', { components: { basePay: 999 } }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('allows edit when template is not assigned', async () => {
    findByIdMock.mockResolvedValue(sampleTemplate);

    const updated = await service.update('tpl-1', {
      components: { basePay: 1_300_000 },
    });

    expect(updated.components.basePay).toBe(1_300_000);
    expect(updateMock).toHaveBeenCalled();
  });

  it('deletes an unassigned template', async () => {
    findByIdMock.mockResolvedValue(sampleTemplate);

    await service.remove('tpl-1');

    expect(deleteMock).toHaveBeenCalledWith('tpl-1');
  });

  it('rejects delete when template is assigned', async () => {
    findByIdMock.mockResolvedValue({ ...sampleTemplate, isAssigned: true });

    await expect(service.remove('tpl-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it('markAssigned sets isAssigned true', async () => {
    findByIdMock.mockResolvedValue(sampleTemplate);

    const marked = await service.markAssigned('tpl-1');

    expect(marked.isAssigned).toBe(true);
  });

  it('findOne throws when missing', async () => {
    findByIdMock.mockResolvedValue(null);

    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
