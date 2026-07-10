import type { SalaryRecord } from '../../domain/salary-record.model';

export interface SalaryHistoryQuery {
  page: number;
  limit: number;
}

export interface SalaryHistoryResult {
  data: SalaryRecord[];
  total: number;
}

export const SALARY_RECORD_REPOSITORY = Symbol('SALARY_RECORD_REPOSITORY');

export interface SalaryRecordRepositoryPort {
  findById(id: string): Promise<SalaryRecord | null>;
  findByEmployeeId(
    employeeId: string,
    query: SalaryHistoryQuery,
  ): Promise<SalaryHistoryResult>;
  save(record: SalaryRecord): Promise<SalaryRecord>;
}
