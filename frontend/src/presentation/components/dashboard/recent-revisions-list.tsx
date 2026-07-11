import React from 'react';
import { Link } from 'react-router-dom';

import { formatCurrency } from '@/domain/formatters/currency';
import { formatDate } from '@/domain/formatters/date';
import type { RecentRevision } from '@/domain/types/dashboard.types';

export type RecentRevisionsListProps = {
  rows: RecentRevision[];
  isLoading?: boolean;
};

export function RecentRevisionsList({
  rows,
  isLoading = false,
}: RecentRevisionsListProps): React.ReactElement {
  if (isLoading) {
    return (
      <div
        className="rounded-xl border border-border bg-surface p-8 text-center text-ink-muted shadow-xs"
        role="status"
      >
        Loading recent revisions…
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center text-ink-muted shadow-xs">
        No committed salary revisions yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-xs">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead className="border-b border-border bg-surface-raised text-ink-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Employee</th>
            <th className="px-4 py-3 font-medium">Effective</th>
            <th className="px-4 py-3 font-medium">Compensation</th>
            <th className="px-4 py-3 font-medium">Reason</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-border last:border-b-0"
            >
              <td className="px-4 py-3">
                <Link
                  to={`/employees/${row.employeeId}`}
                  className="font-medium text-brand hover:underline"
                >
                  {row.employeeName}
                </Link>
                <div className="font-mono text-xs text-ink-subtle">
                  {row.employeeCode}
                </div>
              </td>
              <td className="px-4 py-3 text-ink-muted">
                {formatDate(row.effectiveDate)}
              </td>
              <td className="px-4 py-3 font-mono text-ink">
                {formatCurrency(row.totalCompensation, row.currency)}
              </td>
              <td className="px-4 py-3 text-ink-muted">{row.reason ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
