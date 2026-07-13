import { Injectable } from '@nestjs/common';
import type {
  DraftEmployeeSummary,
  SalaryDraft,
  SalaryDraftListItem,
} from '../../src/modules/salary-drafts/domain/salary-draft.model';
import type {
  SalaryDraftListQuery,
  SalaryDraftListResult,
  SalaryDraftRepositoryPort,
} from '../../src/modules/salary-drafts/ports/outbound/salary-draft.repository.port';

@Injectable()
export class InMemorySalaryDraftRepository implements SalaryDraftRepositoryPort {
  private drafts: SalaryDraft[] = [];
  private employeeLookup: (employeeId: string) => DraftEmployeeSummary | null =
    () => null;

  setEmployeeLookup(
    lookup: (employeeId: string) => DraftEmployeeSummary | null,
  ): void {
    this.employeeLookup = lookup;
  }

  findById(id: string): Promise<SalaryDraft | null> {
    const draft = this.drafts.find((row) => row.id === id);
    return Promise.resolve(draft ? this.clone(draft) : null);
  }

  findListItemById(id: string): Promise<SalaryDraftListItem | null> {
    const draft = this.drafts.find((row) => row.id === id);
    if (!draft) {
      return Promise.resolve(null);
    }
    return Promise.resolve(this.toListItem(draft));
  }

  findByEmployeeId(employeeId: string): Promise<SalaryDraft | null> {
    const draft = this.drafts.find((row) => row.employeeId === employeeId);
    return Promise.resolve(draft ? this.clone(draft) : null);
  }

  findByEmployeeIds(employeeIds: string[]): Promise<SalaryDraft[]> {
    const idSet = new Set(employeeIds);
    return Promise.resolve(
      this.drafts
        .filter((row) => idSet.has(row.employeeId))
        .map((row) => this.clone(row)),
    );
  }

  findMany(query: SalaryDraftListQuery): Promise<SalaryDraftListResult> {
    const rows = [...this.drafts].sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    );
    const total = rows.length;
    const start = (query.page - 1) * query.limit;
    const data = rows
      .slice(start, start + query.limit)
      .map((row) => this.toListItem(row));
    return Promise.resolve({ data, total });
  }

  save(draft: SalaryDraft): Promise<SalaryDraft> {
    this.drafts.push(this.clone(draft));
    return Promise.resolve(this.clone(draft));
  }

  saveMany(drafts: SalaryDraft[]): Promise<SalaryDraft[]> {
    const saved = drafts.map((draft) => {
      const index = this.drafts.findIndex((row) => row.id === draft.id);
      const clone = this.clone(draft);
      if (index >= 0) {
        this.drafts[index] = clone;
      } else {
        this.drafts.push(clone);
      }
      return this.clone(clone);
    });
    return Promise.resolve(saved);
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

  private toListItem(draft: SalaryDraft): SalaryDraftListItem {
    const employee = this.employeeLookup(draft.employeeId) ?? {
      employeeId: '',
      name: '',
      email: '',
    };
    return {
      ...this.clone(draft),
      employee,
    };
  }

  private clone(draft: SalaryDraft): SalaryDraft {
    return {
      ...draft,
      components: { ...draft.components },
    };
  }
}
