import React from 'react';

import { formatCurrency } from '@/domain/formatters/currency';
import type { DashboardSummary } from '@/domain/types/dashboard.types';
import { DISPLAY_CURRENCY_ORIGINAL } from '@/domain/types/dashboard.types';

export type SummaryCardsProps = {
  summary: DashboardSummary | undefined;
  isLoading?: boolean;
};

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.ReactElement {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl text-ink">{value}</p>
    </div>
  );
}

export function SummaryCards({
  summary,
  isLoading = false,
}: SummaryCardsProps): React.ReactElement {
  if (isLoading || !summary) {
    return (
      <div
        className="rounded-xl border border-border bg-surface p-8 text-center text-ink-muted shadow-xs"
        role="status"
      >
        Loading summary…
      </div>
    );
  }

  const isOriginal = summary.displayCurrency === DISPLAY_CURRENCY_ORIGINAL;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label="Active employees"
          value={String(summary.activeEmployeeCount)}
        />
        {!isOriginal ? (
          <>
            <MetricCard
              label="Total payroll"
              value={formatCurrency(
                summary.totalPayroll ?? 0,
                summary.displayCurrency,
              )}
            />
            <MetricCard
              label="Average compensation"
              value={formatCurrency(
                summary.averageCompensation ?? 0,
                summary.displayCurrency,
              )}
            />
          </>
        ) : null}
      </div>

      {isOriginal && summary.byCurrency && summary.byCurrency.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-xs">
          <table className="w-full min-w-[480px] border-collapse text-left text-sm">
            <caption className="sr-only">Payroll by original currency</caption>
            <thead className="border-b border-border bg-surface-raised text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Currency</th>
                <th className="px-4 py-3 font-medium">Employees</th>
                <th className="px-4 py-3 font-medium">Total payroll</th>
                <th className="px-4 py-3 font-medium">Average</th>
              </tr>
            </thead>
            <tbody>
              {summary.byCurrency.map((row) => (
                <tr
                  key={row.currency}
                  className="border-b border-border last:border-b-0"
                >
                  <td className="px-4 py-3 font-mono text-ink">
                    {row.currency}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {row.employeeCount}
                  </td>
                  <td className="px-4 py-3 font-mono text-ink">
                    {formatCurrency(row.totalPayroll, row.currency)}
                  </td>
                  <td className="px-4 py-3 font-mono text-ink">
                    {formatCurrency(row.averageCompensation, row.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {isOriginal && (!summary.byCurrency || summary.byCurrency.length === 0) ? (
        <p className="text-sm text-ink-muted">
          No committed salaries to break down by currency.
        </p>
      ) : null}
    </div>
  );
}
