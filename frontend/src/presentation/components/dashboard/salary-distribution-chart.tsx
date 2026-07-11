import React from 'react';

import type { DistributionBucket } from '@/domain/types/dashboard.types';
import { theme } from '@/presentation/styles/tokens';

export type SalaryDistributionChartProps = {
  buckets: DistributionBucket[];
  isLoading?: boolean;
};

export function SalaryDistributionChart({
  buckets,
  isLoading = false,
}: SalaryDistributionChartProps): React.ReactElement {
  if (isLoading) {
    return (
      <div
        className="rounded-xl border border-border bg-surface p-8 text-center text-ink-muted shadow-xs"
        role="status"
      >
        Loading distribution…
      </div>
    );
  }

  if (buckets.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center text-ink-muted shadow-xs">
        No compensation distribution data yet.
      </div>
    );
  }

  const maxCount = Math.max(...buckets.map((bucket) => bucket.count), 1);

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
      <ul className="space-y-3" aria-label="Salary distribution">
        {buckets.map((bucket) => {
          const widthPercent = (bucket.count / maxCount) * 100;

          return (
            <li key={bucket.range} className="grid grid-cols-[minmax(0,9rem)_1fr_2.5rem] items-center gap-3 text-sm">
              <span className="truncate font-mono text-xs text-ink-muted">
                {bucket.range}
              </span>
              <div className="h-3 overflow-hidden rounded-sm bg-canvas-muted">
                <div
                  className="h-full rounded-sm transition-[width] duration-base ease-out"
                  style={{
                    width: `${widthPercent}%`,
                    backgroundColor: theme.colors.brand,
                  }}
                />
              </div>
              <span className="text-right font-mono text-ink">{bucket.count}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
