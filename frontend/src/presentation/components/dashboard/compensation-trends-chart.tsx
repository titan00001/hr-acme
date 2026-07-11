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
import { formatCurrency } from '@/domain/formatters/currency';
import { formatDate } from '@/domain/formatters/date';
import type { TrendPoint } from '@/domain/types/dashboard.types';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { theme } from '@/presentation/styles/tokens';

export type CompensationTrendsChartProps = {
  points: TrendPoint[];
  from: string;
  to: string;
  onRangeChange: (range: { from: string; to: string }) => void;
  isLoading?: boolean;
};

export function CompensationTrendsChart({
  points,
  from,
  to,
  onRangeChange,
  isLoading = false,
}: CompensationTrendsChartProps): React.ReactElement {
  const data = useMemo(
    () =>
      points.map((point, index) => ({
        key: `${point.date}-${point.currency ?? 'x'}-${index}`,
        label: point.date.slice(5),
        date: point.date,
        totalPayroll: point.totalPayroll,
        currency: point.currency ?? '',
      })),
    [points],
  );

  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface p-4 shadow-xs">
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="trends-from">From</Label>
          <Input
            id="trends-from"
            type="date"
            value={from}
            max={to}
            onChange={(event) =>
              onRangeChange({ from: event.target.value, to })
            }
            className="w-auto"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="trends-to">To</Label>
          <Input
            id="trends-to"
            type="date"
            value={to}
            min={from}
            onChange={(event) =>
              onRangeChange({ from, to: event.target.value })
            }
            className="w-auto"
          />
        </div>
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-ink-muted" role="status">
          Loading trends…
        </p>
      ) : points.length === 0 ? (
        <p className="py-8 text-center text-ink-muted">
          No committed salary changes in this date range.
        </p>
      ) : (
        <div
          className="h-64 w-full"
          role="img"
          aria-label="Compensation trends chart"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={theme.chart.border}
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fill: theme.chart.inkMuted, fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: theme.chart.border }}
                minTickGap={12}
              />
              <YAxis
                dataKey="totalPayroll"
                tick={{ fill: theme.chart.inkMuted, fontSize: 11 }}
                tickFormatter={formatAxisCompact}
                width={52}
                tickLine={false}
                axisLine={{ stroke: theme.chart.border }}
                label={{
                  value: 'Payroll',
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
                formatter={(value, _name, item) => {
                  const currency =
                    (item?.payload as { currency?: string } | undefined)
                      ?.currency ?? 'USD';
                  return [
                    formatCurrency(Number(value ?? 0), currency || 'USD'),
                    'Payroll',
                  ];
                }}
                labelFormatter={(_label, payload) => {
                  const point = payload?.[0]?.payload as
                    | { date?: string; currency?: string }
                    | undefined;
                  if (!point?.date) {
                    return '';
                  }
                  return point.currency
                    ? `${formatDate(point.date)} · ${point.currency}`
                    : formatDate(point.date);
                }}
              />
              <Bar
                dataKey="totalPayroll"
                name="Payroll"
                fill={theme.chart.brand}
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
