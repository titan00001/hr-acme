import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import { computeDraftProposedTotal } from '@/domain/formatters/draft-total';
import { formatCurrency } from '@/domain/formatters/currency';
import { formatDate } from '@/domain/formatters/date';
import type { SalaryDraft } from '@/domain/types/salary.types';
import { formatApiErrorMessage } from '@/infrastructure/api/extract-api-error';
import {
  useCommitSalaryDraftMutation,
  useRollbackSalaryDraftMutation,
} from '@/infrastructure/api/salary-drafts-api';
import { Dialog } from '@/presentation/components/ui/dialog';
import { Button } from '@/presentation/components/ui/button';

export type DraftsTableProps = {
  rows: SalaryDraft[];
  isLoading?: boolean;
};

export function DraftsTable({
  rows,
  isLoading = false,
}: DraftsTableProps): React.ReactElement {
  const [rollbackTarget, setRollbackTarget] = useState<SalaryDraft | null>(
    null,
  );
  const [commitDraft, commitState] = useCommitSalaryDraftMutation();
  const [rollbackDraft, rollbackState] = useRollbackSalaryDraftMutation();

  if (isLoading) {
    return (
      <div
        className="rounded-xl border border-border bg-surface p-8 text-center text-ink-muted shadow-xs"
        role="status"
      >
        Loading drafts…
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center text-ink-muted shadow-xs">
        No pending salary drafts.
      </div>
    );
  }

  const actionError = commitState.error ?? rollbackState.error;

  return (
    <>
      {actionError ? (
        <p className="mb-3 text-sm text-danger" role="alert">
          {formatApiErrorMessage(actionError, 'Draft action failed')}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-xs">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead className="border-b border-border bg-surface-raised text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Employee</th>
              <th className="px-4 py-3 font-medium">Proposed total</th>
              <th className="px-4 py-3 font-medium">Effective</th>
              <th className="px-4 py-3 font-medium">Reason</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((draft) => {
              const proposed = computeDraftProposedTotal({
                baseSalary: draft.baseSalary,
                components: draft.components,
                stockValueInSalaryCurrency: draft.stockValueInSalaryCurrency,
              });

              return (
                <tr
                  key={draft.id}
                  className="border-b border-border last:border-b-0"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/employees/${draft.employeeId}`}
                      className="font-medium text-brand hover:underline"
                    >
                      View employee
                    </Link>
                    <div className="font-mono text-xs text-ink-subtle">
                      {draft.employeeId.slice(0, 8)}…
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-ink">
                    {formatCurrency(proposed, draft.currency)}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {formatDate(draft.effectiveDate)}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {draft.reason ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={commitState.isLoading}
                        onClick={() => {
                          void commitDraft(draft.id);
                        }}
                      >
                        Commit
                      </Button>
                      <Link
                        to={`/employees/${draft.employeeId}/salary/edit`}
                        className="inline-flex h-8 items-center rounded-sm border border-border bg-surface px-3 text-xs font-medium text-ink transition-theme hover:bg-surface-raised"
                      >
                        Edit
                      </Link>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={rollbackState.isLoading}
                        onClick={() => setRollbackTarget(draft)}
                      >
                        Rollback
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog
        open={rollbackTarget !== null}
        onClose={() => setRollbackTarget(null)}
        title="Rollback draft"
        description="This deletes the pending draft. The active salary is unchanged."
      >
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setRollbackTarget(null)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={rollbackState.isLoading}
            onClick={() => {
              if (!rollbackTarget) {
                return;
              }
              void rollbackDraft(rollbackTarget.id)
                .unwrap()
                .then(() => setRollbackTarget(null))
                .catch(() => undefined);
            }}
          >
            Confirm rollback
          </Button>
        </div>
      </Dialog>
    </>
  );
}
