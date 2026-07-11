import React from 'react';

import { formatSalarySummary } from '@/domain/formatters/currency';
import { formatDate } from '@/domain/formatters/date';
import type { Employee } from '@/domain/types/employee.types';
import { Badge } from '@/presentation/components/ui/badge';
import { cn } from '@/presentation/lib/cn';

export type EmployeeTableProps = {
  rows: Employee[];
  isLoading?: boolean;
  onRowClick?: (employee: Employee) => void;
};

function employmentLabel(type: Employee['employmentType']): string {
  return type === 'PartTime' ? 'Part-time' : type;
}

export function EmployeeTable({
  rows,
  isLoading = false,
  onRowClick,
}: EmployeeTableProps): React.ReactElement {
  if (isLoading) {
    return (
      <div
        className="rounded-xl border border-border bg-surface p-8 text-center text-ink-muted shadow-xs"
        role="status"
      >
        Loading employees…
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center text-ink-muted shadow-xs">
        No employees match your filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-xs">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead className="border-b border-border bg-surface-raised text-ink-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Employee</th>
            <th className="px-4 py-3 font-medium">Country</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Joined</th>
            <th className="px-4 py-3 font-medium">Salary</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((employee) => (
            <tr
              key={employee.id}
              className={cn(
                'border-b border-border last:border-b-0',
                onRowClick
                  ? 'cursor-pointer transition-theme hover:bg-brand-soft/40'
                  : undefined,
              )}
              onClick={() => onRowClick?.(employee)}
            >
              <td className="px-4 py-3">
                <div className="font-medium text-ink">{employee.name}</div>
                <div className="text-xs text-ink-subtle">
                  {employee.employeeId} · {employee.email}
                </div>
              </td>
              <td className="px-4 py-3 text-ink">{employee.country}</td>
              <td className="px-4 py-3">
                <Badge tone="brand">
                  {employmentLabel(employee.employmentType)}
                </Badge>
              </td>
              <td className="px-4 py-3 text-ink-muted">
                {formatDate(employee.joiningDate)}
              </td>
              <td className="px-4 py-3 font-mono text-ink">
                {formatSalarySummary(employee.currentSalary)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
