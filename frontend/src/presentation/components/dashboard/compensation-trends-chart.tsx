import React from 'react';

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
  const maxPayroll = Math.max(...points.map((point) => point.totalPayroll), 1);
  const chartHeight = 160;
  const chartWidth = Math.max(points.length * 48, 240);
  const padY = 12;

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
        <div className="overflow-x-auto">
          <svg
            role="img"
            aria-label="Compensation trends chart"
            width={chartWidth}
            height={chartHeight + 36}
            className="min-w-full"
          >
            {points.map((point, index) => {
              const barWidth = 28;
              const gap = 20;
              const x = index * (barWidth + gap) + 8;
              const usable = chartHeight - padY * 2;
              const barHeight = (point.totalPayroll / maxPayroll) * usable;
              const y = chartHeight - padY - barHeight;
              const currency = point.currency ?? '';

              return (
                <g key={`${point.date}-${currency}-${index}`}>
                  <title>
                    {formatDate(point.date)}
                    {currency ? ` · ${currency}` : ''}:{' '}
                    {formatCurrency(point.totalPayroll, currency || 'USD')}
                  </title>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={Math.max(barHeight, 2)}
                    rx={2}
                    fill={theme.colors.brand}
                  />
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight + 14}
                    textAnchor="middle"
                    className="fill-ink-subtle"
                    style={{ fontSize: 10 }}
                  >
                    {point.date.slice(5)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
}
