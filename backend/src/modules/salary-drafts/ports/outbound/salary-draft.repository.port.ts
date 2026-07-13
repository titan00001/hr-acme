import type {
  SalaryDraft,
  SalaryDraftListItem,
} from '../../domain/salary-draft.model';

export interface SalaryDraftListQuery {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface SalaryDraftListResult {
  data: SalaryDraftListItem[];
  total: number;
}

export const SALARY_DRAFT_REPOSITORY = Symbol('SALARY_DRAFT_REPOSITORY');

export interface SalaryDraftRepositoryPort {
  findById(id: string): Promise<SalaryDraft | null>;
  findListItemById(id: string): Promise<SalaryDraftListItem | null>;
  findByEmployeeId(employeeId: string): Promise<SalaryDraft | null>;
  findByEmployeeIds(employeeIds: string[]): Promise<SalaryDraft[]>;
  findMany(query: SalaryDraftListQuery): Promise<SalaryDraftListResult>;
  save(draft: SalaryDraft): Promise<SalaryDraft>;
  saveMany(drafts: SalaryDraft[]): Promise<SalaryDraft[]>;
  update(draft: SalaryDraft): Promise<SalaryDraft>;
  delete(id: string): Promise<void>;
}
