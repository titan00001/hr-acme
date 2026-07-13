import type { MigrationCandidate } from '../../domain/migration-candidate.model';
import type { SalaryRecord } from '../../domain/salary-record.model';

export interface SalaryHistoryQuery {
  page: number;
  limit: number;
}

export interface SalaryHistoryResult {
  data: SalaryRecord[];
  total: number;
}

export interface MigrationCandidatesResult {
  data: MigrationCandidate[];
  total: number;
}

export const SALARY_RECORD_REPOSITORY = Symbol('SALARY_RECORD_REPOSITORY');

export interface SalaryRecordRepositoryPort {
  findById(id: string): Promise<SalaryRecord | null>;
  findByIds(ids: string[]): Promise<SalaryRecord[]>;
  findByEmployeeId(
    employeeId: string,
    query: SalaryHistoryQuery,
  ): Promise<SalaryHistoryResult>;
  findMigrationCandidates(
    sourceTemplateIds: string[],
    query: SalaryHistoryQuery,
  ): Promise<MigrationCandidatesResult>;
  save(record: SalaryRecord): Promise<SalaryRecord>;
}
