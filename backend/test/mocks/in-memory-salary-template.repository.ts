import { Injectable } from '@nestjs/common';
import type { SalaryTemplate } from '../../src/modules/salary-templates/domain/salary-template.model';
import type {
  SalaryTemplateListQuery,
  SalaryTemplateListResult,
  SalaryTemplateRepositoryPort,
} from '../../src/modules/salary-templates/ports/outbound/salary-template.repository.port';

@Injectable()
export class InMemorySalaryTemplateRepository implements SalaryTemplateRepositoryPort {
  private templates: SalaryTemplate[] = [];

  findById(id: string): Promise<SalaryTemplate | null> {
    const template = this.templates.find((row) => row.id === id);
    return Promise.resolve(template ? this.clone(template) : null);
  }

  findByNameAndVersion(
    name: string,
    version: number,
  ): Promise<SalaryTemplate | null> {
    const template = this.templates.find(
      (row) => row.name === name && row.version === version,
    );
    return Promise.resolve(template ? this.clone(template) : null);
  }

  findLatestByName(name: string): Promise<SalaryTemplate | null> {
    const matches = this.templates.filter((row) => row.name === name);
    if (matches.length === 0) {
      return Promise.resolve(null);
    }
    const latest = matches.reduce((best, row) =>
      row.version > best.version ? row : best,
    );
    return Promise.resolve(this.clone(latest));
  }

  findMaxVersionByName(name: string): Promise<number> {
    const matches = this.templates.filter((row) => row.name === name);
    if (matches.length === 0) {
      return Promise.resolve(0);
    }
    return Promise.resolve(Math.max(...matches.map((row) => row.version)));
  }

  findAllByName(name: string): Promise<SalaryTemplate[]> {
    const matches = this.templates
      .filter((row) => row.name === name)
      .sort((a, b) => b.version - a.version)
      .map((row) => this.clone(row));
    return Promise.resolve(matches);
  }

  findMany(query: SalaryTemplateListQuery): Promise<SalaryTemplateListResult> {
    let rows = [...this.templates];

    if (query.country) {
      rows = rows.filter((row) => row.country === query.country);
    }
    if (query.currency) {
      rows = rows.filter((row) => row.currency === query.currency);
    }
    if (query.search) {
      const search = query.search.toLowerCase();
      rows = rows.filter((row) => row.name.toLowerCase().includes(search));
    }
    if (query.isAssigned !== undefined) {
      rows = rows.filter((row) => row.isAssigned === query.isAssigned);
    }

    const sortBy = query.sortBy ?? 'name';
    const sortOrder = query.sortOrder === 'DESC' ? -1 : 1;
    rows.sort((a, b) => {
      if (sortBy === 'name') {
        const byName = a.name.localeCompare(b.name) * sortOrder;
        if (byName !== 0) {
          return byName;
        }
        return b.version - a.version;
      }
      if (sortBy === 'version') {
        return (a.version - b.version) * sortOrder;
      }
      if (sortBy === 'country') {
        return a.country.localeCompare(b.country) * sortOrder;
      }
      if (sortBy === 'currency') {
        return a.currency.localeCompare(b.currency) * sortOrder;
      }
      if (sortBy === 'createdAt') {
        return (a.createdAt.getTime() - b.createdAt.getTime()) * sortOrder;
      }
      return a.name.localeCompare(b.name) * sortOrder;
    });

    const total = rows.length;
    const start = (query.page - 1) * query.limit;
    const data = rows
      .slice(start, start + query.limit)
      .map((row) => this.clone(row));

    return Promise.resolve({ data, total });
  }

  save(template: SalaryTemplate): Promise<SalaryTemplate> {
    this.templates.push(this.clone(template));
    return Promise.resolve(this.clone(template));
  }

  update(template: SalaryTemplate): Promise<SalaryTemplate> {
    const index = this.templates.findIndex((row) => row.id === template.id);
    if (index >= 0) {
      this.templates[index] = this.clone(template);
    } else {
      this.templates.push(this.clone(template));
    }
    return Promise.resolve(this.clone(template));
  }

  delete(id: string): Promise<void> {
    this.templates = this.templates.filter((row) => row.id !== id);
    return Promise.resolve();
  }

  clear(): void {
    this.templates = [];
  }

  all(): SalaryTemplate[] {
    return this.templates.map((row) => this.clone(row));
  }

  seed(template: SalaryTemplate): void {
    this.templates.push(this.clone(template));
  }

  private clone(template: SalaryTemplate): SalaryTemplate {
    return {
      ...template,
      components: {
        ...template.components,
        ...(template.components.stock
          ? { stock: { ...template.components.stock } }
          : {}),
      },
    };
  }
}
