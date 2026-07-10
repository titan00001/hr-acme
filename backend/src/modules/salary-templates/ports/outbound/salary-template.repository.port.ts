import type { SalaryTemplate } from '../../domain/salary-template.model';

export interface SalaryTemplateListQuery {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  country?: string;
  currency?: string;
}

export interface SalaryTemplateListResult {
  data: SalaryTemplate[];
  total: number;
}

export const SALARY_TEMPLATE_REPOSITORY = Symbol('SALARY_TEMPLATE_REPOSITORY');

export interface SalaryTemplateRepositoryPort {
  findById(id: string): Promise<SalaryTemplate | null>;
  findByNameAndVersion(
    name: string,
    version: number,
  ): Promise<SalaryTemplate | null>;
  findLatestByName(name: string): Promise<SalaryTemplate | null>;
  findMaxVersionByName(name: string): Promise<number>;
  findMany(query: SalaryTemplateListQuery): Promise<SalaryTemplateListResult>;
  save(template: SalaryTemplate): Promise<SalaryTemplate>;
  update(template: SalaryTemplate): Promise<SalaryTemplate>;
}
