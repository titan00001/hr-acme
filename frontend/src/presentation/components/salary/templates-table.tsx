import React from 'react';

import { formatCurrency } from '@/domain/formatters/currency';
import type { SalaryTemplate } from '@/domain/types/salary-template.types';
import { Badge } from '@/presentation/components/ui/badge';
import { Button } from '@/presentation/components/ui/button';
import { cn } from '@/presentation/lib/cn';

export type TemplatesTableProps = {
  rows: SalaryTemplate[];
  isLoading?: boolean;
  onRowClick?: (template: SalaryTemplate) => void;
  onEdit?: (template: SalaryTemplate) => void;
  onDelete?: (template: SalaryTemplate) => void;
  onCreateVersion?: (template: SalaryTemplate) => void;
};

export function TemplatesTable({
  rows,
  isLoading = false,
  onRowClick,
  onEdit,
  onDelete,
  onCreateVersion,
}: TemplatesTableProps): React.ReactElement {
  if (isLoading) {
    return (
      <div
        className="rounded-xl border border-border bg-surface p-8 text-center text-ink-muted shadow-xs"
        role="status"
      >
        Loading templates…
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center text-ink-muted shadow-xs">
        No salary templates match your filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-xs">
      <table className="w-full min-w-[840px] border-collapse text-left text-sm">
        <thead className="border-b border-border bg-surface-raised text-ink-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Template</th>
            <th className="px-4 py-3 font-medium">Country</th>
            <th className="px-4 py-3 font-medium">Base pay</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((template) => (
            <tr
              key={template.id}
              className={cn(
                'border-b border-border last:border-b-0',
                onRowClick
                  ? 'cursor-pointer transition-theme hover:bg-brand-soft/40'
                  : undefined,
              )}
              onClick={() => onRowClick?.(template)}
            >
              <td className="px-4 py-3">
                <div className="font-medium text-ink">{template.name}</div>
                <div className="font-mono text-xs text-ink-subtle">
                  v{template.version}
                  {template.latestVersion > template.version
                    ? ` · latest v${template.latestVersion}`
                    : ''}
                </div>
              </td>
              <td className="px-4 py-3 text-ink">
                {template.country}
                <div className="font-mono text-xs text-ink-subtle">
                  {template.currency}
                </div>
              </td>
              <td className="px-4 py-3 font-mono text-ink">
                {formatCurrency(template.components.basePay, template.currency)}
              </td>
              <td className="px-4 py-3">
                <Badge tone={template.isAssigned ? 'warning' : 'success'}>
                  {template.isAssigned ? 'Assigned' : 'Unused'}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <div
                  className="flex flex-wrap gap-2"
                  onClick={(event) => event.stopPropagation()}
                >
                  {template.isAssigned ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onCreateVersion?.(template)}
                    >
                      Create version
                    </Button>
                  ) : (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit?.(template)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        onClick={() => onDelete?.(template)}
                      >
                        Delete
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onCreateVersion?.(template)}
                      >
                        Create version
                      </Button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
