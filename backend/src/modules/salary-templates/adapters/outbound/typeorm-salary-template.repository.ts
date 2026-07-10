import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { safeOrderBy } from '../../../../common/pagination/pagination.utils';
import type { SalaryTemplate } from '../../domain/salary-template.model';
import {
  SalaryTemplateListQuery,
  SalaryTemplateListResult,
  SalaryTemplateRepositoryPort,
} from '../../ports/outbound/salary-template.repository.port';
import { SalaryTemplateEntity } from './salary-template.entity';

const ALLOWED_SORT_FIELDS = [
  'name',
  'version',
  'country',
  'currency',
  'createdAt',
] as const;

function toDomain(entity: SalaryTemplateEntity): SalaryTemplate {
  return {
    id: entity.id,
    name: entity.name,
    version: entity.version,
    country: entity.country,
    currency: entity.currency,
    components: entity.components,
    isAssigned: entity.isAssigned,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

function toEntity(template: SalaryTemplate): SalaryTemplateEntity {
  const entity = new SalaryTemplateEntity();
  entity.id = template.id;
  entity.name = template.name;
  entity.version = template.version;
  entity.country = template.country;
  entity.currency = template.currency;
  entity.components = template.components;
  entity.isAssigned = template.isAssigned;
  entity.createdAt = template.createdAt;
  entity.updatedAt = template.updatedAt;
  return entity;
}

@Injectable()
export class TypeOrmSalaryTemplateRepository implements SalaryTemplateRepositoryPort {
  constructor(
    @InjectRepository(SalaryTemplateEntity)
    private readonly repository: Repository<SalaryTemplateEntity>,
  ) {}

  async findById(id: string): Promise<SalaryTemplate | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? toDomain(entity) : null;
  }

  async findByNameAndVersion(
    name: string,
    version: number,
  ): Promise<SalaryTemplate | null> {
    const entity = await this.repository.findOne({ where: { name, version } });
    return entity ? toDomain(entity) : null;
  }

  async findLatestByName(name: string): Promise<SalaryTemplate | null> {
    const entity = await this.repository.findOne({
      where: { name },
      order: { version: 'DESC' },
    });
    return entity ? toDomain(entity) : null;
  }

  async findMaxVersionByName(name: string): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('template')
      .select('MAX(template.version)', 'max')
      .where('template.name = :name', { name })
      .getRawOne<{ max: string | null }>();

    return result?.max ? Number(result.max) : 0;
  }

  async findMany(
    query: SalaryTemplateListQuery,
  ): Promise<SalaryTemplateListResult> {
    const qb = this.repository.createQueryBuilder('template');

    if (query.country) {
      qb.andWhere('template.country = :country', { country: query.country });
    }

    if (query.currency) {
      qb.andWhere('template.currency = :currency', {
        currency: query.currency,
      });
    }

    const order = safeOrderBy(
      query.sortBy,
      query.sortOrder,
      ALLOWED_SORT_FIELDS,
      'template',
    );

    if (order) {
      qb.orderBy(`template.${order.field}`, order.order);
    } else {
      qb.orderBy('template.name', 'ASC').addOrderBy('template.version', 'DESC');
    }

    const page = query.page;
    const limit = query.limit;
    qb.skip((page - 1) * limit).take(limit);

    const [entities, total] = await qb.getManyAndCount();

    return {
      data: entities.map(toDomain),
      total,
    };
  }

  async save(template: SalaryTemplate): Promise<SalaryTemplate> {
    const saved = await this.repository.save(toEntity(template));
    return toDomain(saved);
  }

  async update(template: SalaryTemplate): Promise<SalaryTemplate> {
    const saved = await this.repository.save(toEntity(template));
    return toDomain(saved);
  }
}
