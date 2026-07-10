import { Injectable } from '@nestjs/common';
import type { SalaryDraft } from '../../src/modules/salary-drafts/domain/salary-draft.model';
import type {
  SalaryDraftListQuery,
  SalaryDraftListResult,
  SalaryDraftRepositoryPort,
} from '../../src/modules/salary-drafts/ports/outbound/salary-draft.repository.port';

@Injectable()
export class InMemorySalaryDraftRepository implements SalaryDraftRepositoryPort {
  private drafts: SalaryDraft[] = [];

  findById(id: string): Promise<SalaryDraft | null> {
    const draft = this.drafts.find((row) => row.id === id);
    return Promise.resolve(draft ? this.clone(draft) : null);
  }

  findByEmployeeId(employeeId: string): Promise<SalaryDraft | null> {
    const draft = this.drafts.find((row) => row.employeeId === employeeId);
    return Promise.resolve(draft ? this.clone(draft) : null);
  }

  findMany(query: SalaryDraftListQuery): Promise<SalaryDraftListResult> {
    const rows = [...this.drafts].sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    );
    const total = rows.length;
    const start = (query.page - 1) * query.limit;
    const data = rows
      .slice(start, start + query.limit)
      .map((row) => this.clone(row));
    return Promise.resolve({ data, total });
  }

  save(draft: SalaryDraft): Promise<SalaryDraft> {
    this.drafts.push(this.clone(draft));
    return Promise.resolve(this.clone(draft));
  }

  update(draft: SalaryDraft): Promise<SalaryDraft> {
    const index = this.drafts.findIndex((row) => row.id === draft.id);
    if (index >= 0) {
      this.drafts[index] = this.clone(draft);
    } else {
      this.drafts.push(this.clone(draft));
    }
    return Promise.resolve(this.clone(draft));
  }

  delete(id: string): Promise<void> {
    this.drafts = this.drafts.filter((row) => row.id !== id);
    return Promise.resolve();
  }

  clear(): void {
    this.drafts = [];
  }

  count(): number {
    return this.drafts.length;
  }

  private clone(draft: SalaryDraft): SalaryDraft {
    return {
      ...draft,
      components: { ...draft.components },
    };
  }
}
