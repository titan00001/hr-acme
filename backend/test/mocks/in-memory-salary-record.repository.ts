import { Injectable } from '@nestjs/common';
import type { SalaryRecord } from '../../src/modules/salary/domain/salary-record.model';
import type { SalaryRecordRepositoryPort } from '../../src/modules/salary/ports/outbound/salary-record.repository.port';

@Injectable()
export class InMemorySalaryRecordRepository implements SalaryRecordRepositoryPort {
  private records: SalaryRecord[] = [];

  findById(id: string): Promise<SalaryRecord | null> {
    const record = this.records.find((row) => row.id === id);
    return Promise.resolve(record ? this.clone(record) : null);
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

  private clone(record: SalaryRecord): SalaryRecord {
    return {
      ...record,
      components: { ...record.components },
    };
  }
}
