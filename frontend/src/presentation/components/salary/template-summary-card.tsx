import React from 'react';

import { formatCurrency } from '@/domain/formatters/currency';
import { formatDate } from '@/domain/formatters/date';
import type { SalaryTemplate } from '@/domain/types/salary-template.types';
import { Badge } from '@/presentation/components/ui/badge';

export type TemplateSummaryCardProps = {
  template: SalaryTemplate;
};

export function TemplateSummaryCard({
  template,
}: TemplateSummaryCardProps): React.ReactElement {
  const { components } = template;

  return (
    <section className="space-y-4 rounded-xl border border-border bg-surface p-6 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-ink">{template.name}</h2>
          <p className="mt-1 font-mono text-sm text-ink-muted">
            v{template.version}
            {template.latestVersion > template.version
              ? ` · family latest v${template.latestVersion}`
              : ' · latest in family'}
          </p>
        </div>
        <Badge tone={template.isAssigned ? 'warning' : 'success'}>
          {template.isAssigned ? 'Assigned' : 'Unused'}
        </Badge>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">
            Country
          </dt>
          <dd className="mt-1 text-ink">{template.country}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">
            Currency
          </dt>
          <dd className="mt-1 font-mono text-ink">{template.currency}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">
            Base pay
          </dt>
          <dd className="mt-1 font-mono text-ink">
            {formatCurrency(components.basePay, template.currency)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">
            Allowances
          </dt>
          <dd className="mt-1 font-mono text-ink">
            {components.allowances !== undefined
              ? formatCurrency(components.allowances, template.currency)
              : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">
            Bonus
          </dt>
          <dd className="mt-1 font-mono text-ink">
            {components.bonus !== undefined
              ? formatCurrency(components.bonus, template.currency)
              : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">
            Stock
          </dt>
          <dd className="mt-1 text-ink">
            {components.stock
              ? `${components.stock.quantity} units${
                  components.stock.vestingDate
                    ? ` · vest ${formatDate(components.stock.vestingDate)}`
                    : ''
                }`
              : '—'}
          </dd>
        </div>
      </dl>
    </section>
  );
}
