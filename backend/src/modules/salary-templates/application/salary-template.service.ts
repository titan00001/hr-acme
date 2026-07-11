import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { getPaginationMeta } from '../../../common/pagination/pagination.utils';
import { SettingsService } from '../../settings/application/settings.service';
import { CreateTemplateDto } from '../adapters/inbound/create-template.dto';
import { CreateTemplateVersionDto } from '../adapters/inbound/create-template-version.dto';
import { TemplateListResponseDto } from '../adapters/inbound/template-list-response.dto';
import { TemplateQueryDto } from '../adapters/inbound/template-query.dto';
import { UpdateTemplateDto } from '../adapters/inbound/update-template.dto';
import type {
  SalaryTemplate,
  TemplateComponents,
} from '../domain/salary-template.model';
import {
  SALARY_TEMPLATE_REPOSITORY,
  type SalaryTemplateRepositoryPort,
} from '../ports/outbound/salary-template.repository.port';
import { toTemplateResponseDto } from './salary-template.mapper';

@Injectable()
export class SalaryTemplateService {
  constructor(
    @Inject(SALARY_TEMPLATE_REPOSITORY)
    private readonly templateRepository: SalaryTemplateRepositoryPort,
    private readonly settingsService: SettingsService,
  ) {}

  async findAll(query: TemplateQueryDto): Promise<TemplateListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const result = await this.templateRepository.findMany({
      page,
      limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      country: query.country,
      currency: query.currency,
      search: query.search,
      isAssigned: query.isAssigned,
    });

    const meta = getPaginationMeta(result.total, page, limit);
    const data = await Promise.all(
      result.data.map(async (template) => {
        const latestVersion =
          await this.templateRepository.findMaxVersionByName(template.name);
        return toTemplateResponseDto(template, latestVersion);
      }),
    );

    return { data, ...meta };
  }

  async findOne(id: string): Promise<SalaryTemplate> {
    const template = await this.templateRepository.findById(id);
    if (!template) {
      throw new NotFoundException(`Salary template ${id} not found`);
    }
    return template;
  }

  async findOneResponse(id: string) {
    const template = await this.findOne(id);
    const latestVersion = await this.templateRepository.findMaxVersionByName(
      template.name,
    );
    return toTemplateResponseDto(template, latestVersion);
  }

  async findLatest(name: string): Promise<SalaryTemplate> {
    const template = await this.templateRepository.findLatestByName(name);
    if (!template) {
      throw new NotFoundException(`Salary template family "${name}" not found`);
    }
    return template;
  }

  async create(dto: CreateTemplateDto): Promise<SalaryTemplate> {
    await this.assertSupportedCountryAndCurrency(dto.country, dto.currency);

    const existing = await this.templateRepository.findByNameAndVersion(
      dto.name,
      1,
    );
    if (existing) {
      throw new ConflictException(
        `Template family "${dto.name}" already exists; create a new version instead`,
      );
    }

    const now = new Date();
    const template: SalaryTemplate = {
      id: randomUUID(),
      name: dto.name,
      version: 1,
      country: dto.country,
      currency: dto.currency.toUpperCase(),
      components: this.normalizeComponents(dto.components),
      isAssigned: false,
      createdAt: now,
      updatedAt: now,
    };

    return this.templateRepository.save(template);
  }

  async createVersion(
    id: string,
    dto: CreateTemplateVersionDto,
  ): Promise<SalaryTemplate> {
    const source = await this.findOne(id);
    await this.assertSupportedCountryAndCurrency(dto.country, dto.currency);

    if (dto.name !== undefined && dto.name !== source.name) {
      throw new BadRequestException(
        `Version name must match template family "${source.name}"`,
      );
    }

    const maxVersion = await this.templateRepository.findMaxVersionByName(
      source.name,
    );
    const now = new Date();
    const template: SalaryTemplate = {
      id: randomUUID(),
      name: source.name,
      version: maxVersion + 1,
      country: dto.country,
      currency: dto.currency.toUpperCase(),
      components: this.normalizeComponents(dto.components),
      isAssigned: false,
      createdAt: now,
      updatedAt: now,
    };

    return this.templateRepository.save(template);
  }

  async update(id: string, dto: UpdateTemplateDto): Promise<SalaryTemplate> {
    const current = await this.findOne(id);

    if (current.isAssigned) {
      throw new BadRequestException(
        `Salary template ${id} is assigned and immutable; create a new version instead`,
      );
    }

    if (dto.country !== undefined || dto.currency !== undefined) {
      await this.assertSupportedCountryAndCurrency(
        dto.country ?? current.country,
        dto.currency ?? current.currency,
      );
    }

    const updated: SalaryTemplate = {
      ...current,
      country: dto.country ?? current.country,
      currency: dto.currency ? dto.currency.toUpperCase() : current.currency,
      components: dto.components
        ? this.normalizeComponents(dto.components)
        : current.components,
      updatedAt: new Date(),
    };

    return this.templateRepository.update(updated);
  }

  async remove(id: string): Promise<void> {
    const current = await this.findOne(id);

    if (current.isAssigned) {
      throw new BadRequestException(
        `Salary template ${id} is assigned and cannot be deleted; create a new version instead`,
      );
    }

    await this.templateRepository.delete(id);
  }

  async markAssigned(id: string): Promise<SalaryTemplate> {
    const current = await this.findOne(id);
    if (current.isAssigned) {
      return current;
    }

    const updated: SalaryTemplate = {
      ...current,
      isAssigned: true,
      updatedAt: new Date(),
    };

    return this.templateRepository.update(updated);
  }

  private async assertSupportedCountryAndCurrency(
    country: string,
    currency: string,
  ): Promise<void> {
    const [countries, currencies] = await Promise.all([
      this.settingsService.getCountries(),
      this.settingsService.getCurrencies(),
    ]);

    if (!countries.includes(country)) {
      throw new BadRequestException(
        `Country ${country} is not in supported countries`,
      );
    }

    const normalized = currency.toUpperCase();
    if (!currencies.includes(normalized)) {
      throw new BadRequestException(
        `Currency ${normalized} is not in supported currencies`,
      );
    }
  }

  private normalizeComponents(
    components: TemplateComponents,
  ): TemplateComponents {
    return {
      basePay: components.basePay,
      ...(components.allowances !== undefined
        ? { allowances: components.allowances }
        : {}),
      ...(components.bonus !== undefined ? { bonus: components.bonus } : {}),
      ...(components.stock
        ? {
            stock: {
              quantity: components.stock.quantity,
              ...(components.stock.vestingDate
                ? { vestingDate: components.stock.vestingDate }
                : {}),
            },
          }
        : {}),
    };
  }
}
