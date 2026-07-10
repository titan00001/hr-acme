import { Injectable } from '@nestjs/common';
import type { SalaryRecord } from '../../src/modules/salary/domain/salary-record.model';
import type {
  SalaryHistoryQuery,
  SalaryHistoryResult,
  SalaryRecordRepositoryPort,
} from '../../src/modules/salary/ports/outbound/salary-record.repository.port';

@Injectable()
export class InMemorySalaryRecordRepository implements SalaryRecordRepositoryPort {
  private records: SalaryRecord[] = [];

  findById(id: string): Promise<SalaryRecord | null> {
    const record = this.records.find((row) => row.id === id);
    return Promise.resolve(record ? this.clone(record) : null);
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
