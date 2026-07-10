import type { SalaryRecord } from '../../domain/salary-record.model';

export const SALARY_RECORD_REPOSITORY = Symbol('SALARY_RECORD_REPOSITORY');

export interface SalaryRecordRepositoryPort {
  findById(id: string): Promise<SalaryRecord | null>;
  save(record: SalaryRecord): Promise<SalaryRecord>;
}
