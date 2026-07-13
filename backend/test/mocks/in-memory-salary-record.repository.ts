import { Injectable } from '@nestjs/common';
import { EmployeeStatus } from '../../src/common/enums/employee-status.enum';
import type { Employee } from '../../src/modules/employees/domain/employee.model';
import type { MigrationCandidate } from '../../src/modules/salary/domain/migration-candidate.model';
import type { SalaryRecord } from '../../src/modules/salary/domain/salary-record.model';
import type {
  MigrationCandidatesResult,
  SalaryHistoryQuery,
  SalaryHistoryResult,
  SalaryRecordRepositoryPort,
} from '../../src/modules/salary/ports/outbound/salary-record.repository.port';
import type { SalaryTemplate } from '../../src/modules/salary-templates/domain/salary-template.model';

@Injectable()
export class InMemorySalaryRecordRepository implements SalaryRecordRepositoryPort {
  private records: SalaryRecord[] = [];
  private employeeLookup: () => Employee[] = () => [];
  private templateLookup: (id: string) => SalaryTemplate | null = () => null;

  setMigrationLookups(options: {
    listEmployees: () => Employee[];
    getTemplate: (id: string) => SalaryTemplate | null;
  }): void {
    this.employeeLookup = options.listEmployees;
    this.templateLookup = options.getTemplate;
  }

  findById(id: string): Promise<SalaryRecord | null> {
    const record = this.records.find((row) => row.id === id);
    return Promise.resolve(record ? this.clone(record) : null);
  }

  findByIds(ids: string[]): Promise<SalaryRecord[]> {
    const idSet = new Set(ids);
    return Promise.resolve(
      this.records
        .filter((row) => idSet.has(row.id))
        .map((row) => this.clone(row)),
    );
  }

  findByEmployeeId(
    employeeId: string,
    query: SalaryHistoryQuery,
  ): Promise<SalaryHistoryResult> {
    const rows = this.records
      .filter((row) => row.employeeId === employeeId)
      .sort((a, b) => {
        const byDate = b.effectiveDate.localeCompare(a.effectiveDate);
        if (byDate !== 0) {
          return byDate;
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

    const total = rows.length;
    const start = (query.page - 1) * query.limit;
    const data = rows
      .slice(start, start + query.limit)
      .map((row) => this.clone(row));

    return Promise.resolve({ data, total });
  }

  findMigrationCandidates(
    sourceTemplateIds: string[],
    query: SalaryHistoryQuery,
  ): Promise<MigrationCandidatesResult> {
    if (sourceTemplateIds.length === 0) {
      return Promise.resolve({ data: [], total: 0 });
    }

    const sourceSet = new Set(sourceTemplateIds);
    const candidates: MigrationCandidate[] = [];

    for (const employee of this.employeeLookup()) {
      if (
        employee.status !== EmployeeStatus.Active ||
        !employee.currentSalaryId
      ) {
        continue;
      }
      const record = this.records.find(
        (row) => row.id === employee.currentSalaryId,
      );
      if (!record?.templateId || !sourceSet.has(record.templateId)) {
        continue;
      }
      const template = this.templateLookup(record.templateId);
      if (!template) {
        continue;
      }
      candidates.push({
        id: employee.id,
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        country: employee.country,
        currentTemplateId: record.templateId,
        currentTemplateVersion: template.version,
        currentSalary: {
          totalCompensation: record.totalCompensation,
          currency: record.currency,
        },
      });
    }

    candidates.sort((a, b) => a.name.localeCompare(b.name));
    const total = candidates.length;
    const start = (query.page - 1) * query.limit;
    const data = candidates.slice(start, start + query.limit);

    return Promise.resolve({ data, total });
  }

  save(record: SalaryRecord): Promise<SalaryRecord> {
    this.records.push(this.clone(record));
    return Promise.resolve(this.clone(record));
  }

  clear(): void {
    this.records = [];
  }

  all(): SalaryRecord[] {
    return this.records.map((row) => this.clone(row));
  }

  seed(record: SalaryRecord): void {
    this.records.push(this.clone(record));
  }

  private clone(record: SalaryRecord): SalaryRecord {
    return {
      ...record,
      components: { ...record.components },
    };
  }
}
