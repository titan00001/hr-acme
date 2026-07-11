import React from 'react';

import { formatCurrency } from '@/domain/formatters/currency';
import type { CountryBreakdown } from '@/domain/types/dashboard.types';

export type CountryBreakdownTableProps = {
  rows: CountryBreakdown[];
  isLoading?: boolean;
};

export function CountryBreakdownTable({
  rows,
  isLoading = false,
}: CountryBreakdownTableProps): React.ReactElement {
  if (isLoading) {
    return (
      <div
        className="rounded-xl border border-border bg-surface p-8 text-center text-ink-muted shadow-xs"
        role="status"
      >
        Loading country breakdown…
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center text-ink-muted shadow-xs">
        No country payroll data yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-xs">
      <table className="w-full min-w-[520px] border-collapse text-left text-sm">
        <thead className="border-b border-border bg-surface-raised text-ink-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Country</th>
            <th className="px-4 py-3 font-medium">Headcount</th>
            <th className="px-4 py-3 font-medium">Payroll</th>
            <th className="px-4 py-3 font-medium">Currency</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={`${row.country}-${row.currency}`}
              className="border-b border-border last:border-b-0"
            >
              <td className="px-4 py-3 font-medium text-ink">{row.country}</td>
              <td className="px-4 py-3 text-ink-muted">{row.headcount}</td>
              <td className="px-4 py-3 font-mono text-ink">
                {formatCurrency(row.payroll, row.currency)}
              </td>
              <td className="px-4 py-3 font-mono text-ink-subtle">
                {row.currency}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
