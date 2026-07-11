import React from 'react';

import { formatCurrency } from '@/domain/formatters/currency';
import { formatDate } from '@/domain/formatters/date';
import type { SalaryRecord } from '@/domain/types/salary.types';

export type SalaryHistoryTimelineProps = {
  records: SalaryRecord[];
  isLoading?: boolean;
};

export function SalaryHistoryTimeline({
  records,
  isLoading = false,
}: SalaryHistoryTimelineProps): React.ReactElement {
  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-xs">
      <h2 className="font-display text-xl text-ink">Salary history</h2>
      {isLoading ? (
        <p className="mt-3 text-ink-muted" role="status">
          Loading history…
        </p>
      ) : records.length === 0 ? (
        <p className="mt-3 text-ink-muted">No committed salary records yet.</p>
      ) : (
        <ol className="mt-4 space-y-4 border-l border-border pl-4">
          {records.map((record) => (
            <li key={record.id} className="relative">
              <span className="absolute -left-[1.35rem] top-1 size-2.5 rounded-full bg-brand" />
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <p className="font-medium text-ink">
                  {formatCurrency(record.totalCompensation, record.currency)}
                </p>
                <p className="text-sm text-ink-subtle">
                  Effective {formatDate(record.effectiveDate)}
                </p>
              </div>
              <p className="text-sm text-ink-muted">
                {record.paymentCycle}
                {record.reason ? ` · ${record.reason}` : ''}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
