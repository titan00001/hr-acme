import React from 'react';

import { formatCurrency, formatSalarySummary } from '@/domain/formatters/currency';
import type { CurrentSalarySummary } from '@/domain/types/employee.types';
import type { SalaryRecord } from '@/domain/types/salary.types';

export type CurrentSalaryCardProps = {
  summary: CurrentSalarySummary | null;
  /** Latest history row when available — shows stock snapshots. */
  latestRecord?: SalaryRecord | null;
};

export function CurrentSalaryCard({
  summary,
  latestRecord,
}: CurrentSalaryCardProps): React.ReactElement {
  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-xs">
      <h2 className="font-display text-xl text-ink">Current salary</h2>
      {!summary ? (
        <p className="mt-3 text-ink-muted">No active salary assigned.</p>
      ) : (
        <div className="mt-4 space-y-3">
          <p className="font-mono text-2xl text-ink">
            {formatSalarySummary(summary)}
          </p>
          <p className="text-sm text-ink-muted">
            Shown in original currency ({summary.currency}).
          </p>
          {latestRecord?.stockPriceAtEntry &&
          latestRecord.stockPriceCurrencyAtEntry ? (
            <div className="rounded-md border border-border bg-surface-raised p-3 text-sm text-ink-muted">
              <p>
                Stock at entry:{' '}
                {formatCurrency(
                  latestRecord.stockPriceAtEntry,
                  latestRecord.stockPriceCurrencyAtEntry,
                )}
              </p>
              {latestRecord.stockValueInSalaryCurrency ? (
                <p className="mt-1">
                  Stock value in salary currency:{' '}
                  {formatCurrency(
                    latestRecord.stockValueInSalaryCurrency,
                    latestRecord.currency,
                  )}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
