import React from 'react';

import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';

export type TemplateFilterValues = {
  search: string;
  country: string;
  currency: string;
  isAssigned: '' | 'true' | 'false';
};

export type TemplateFilterBarProps = {
  values: TemplateFilterValues;
  onChange: (values: TemplateFilterValues) => void;
};

const selectClassName =
  'flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink shadow-xs transition-theme focus-visible:border-brand focus-visible:shadow-focus focus-visible:outline-none';

export function TemplateFilterBar({
  values,
  onChange,
}: TemplateFilterBarProps): React.ReactElement {
  return (
    <div className="grid gap-4 rounded-xl border border-border bg-surface p-4 shadow-xs md:grid-cols-2 lg:grid-cols-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="template-search">Search</Label>
        <Input
          id="template-search"
          placeholder="Template name"
          value={values.search}
          onChange={(event) =>
            onChange({ ...values, search: event.target.value })
          }
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="template-filter-country">Country</Label>
        <Input
          id="template-filter-country"
          placeholder="e.g. India"
          value={values.country}
          onChange={(event) =>
            onChange({ ...values, country: event.target.value })
          }
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="template-filter-currency">Currency</Label>
        <Input
          id="template-filter-currency"
          placeholder="e.g. INR"
          value={values.currency}
          onChange={(event) =>
            onChange({ ...values, currency: event.target.value })
          }
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="template-filter-assigned">Assignment</Label>
        <select
          id="template-filter-assigned"
          className={selectClassName}
          value={values.isAssigned}
          onChange={(event) =>
            onChange({
              ...values,
              isAssigned: event.target
                .value as TemplateFilterValues['isAssigned'],
            })
          }
        >
          <option value="">All</option>
          <option value="false">Unused</option>
          <option value="true">Assigned</option>
        </select>
      </div>
    </div>
  );
}
