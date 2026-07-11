import React, { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { formatAxisCompact } from '@/domain/formatters/axis-compact';
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
  const data = useMemo(
    () =>
      buckets.map((bucket) => ({
        range: bucket.range,
        count: bucket.count,
      })),
    [buckets],
  );

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

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
      <div
        className="h-64 w-full"
        role="img"
        aria-label="Salary distribution chart"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: 4, bottom: 48 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={theme.chart.border}
              vertical={false}
            />
            <XAxis
              dataKey="range"
              tick={{ fill: theme.chart.inkMuted, fontSize: 11 }}
              interval={0}
              angle={-25}
              textAnchor="end"
              height={56}
              tickLine={false}
              axisLine={{ stroke: theme.chart.border }}
            />
            <YAxis
              dataKey="count"
              tick={{ fill: theme.chart.inkMuted, fontSize: 11 }}
              tickFormatter={formatAxisCompact}
              width={44}
              tickLine={false}
              axisLine={{ stroke: theme.chart.border }}
              label={{
                value: 'Employees',
                angle: -90,
                position: 'insideLeft',
                style: {
                  fill: theme.chart.inkSubtle,
                  fontSize: 11,
                  textAnchor: 'middle',
                },
              }}
            />
            <Tooltip
              cursor={{ fill: theme.chart.brandSoft, opacity: 0.45 }}
              contentStyle={{
                borderRadius: 8,
                borderColor: theme.chart.border,
                fontSize: 12,
              }}
              formatter={(value) => [String(value ?? 0), 'Employees']}
              labelFormatter={(label) => `Range ${String(label)}`}
            />
            <Bar
              dataKey="count"
              name="Employees"
              fill={theme.chart.brand}
              radius={[4, 4, 0, 0]}
              maxBarSize={48}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
