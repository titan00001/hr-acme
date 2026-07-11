import React from 'react';

import type { EmploymentType } from '@/domain/types/employee.types';
import { EMPLOYMENT_TYPES } from '@/domain/types/employee.types';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';

export type EmployeeFilterValues = {
  search: string;
  country: string;
  employmentType: EmploymentType | '';
};

export type EmployeeFilterBarProps = {
  values: EmployeeFilterValues;
  onChange: (values: EmployeeFilterValues) => void;
};

const selectClassName =
  'flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink shadow-xs transition-theme focus-visible:border-brand focus-visible:shadow-focus focus-visible:outline-none';

export function EmployeeFilterBar({
  values,
  onChange,
}: EmployeeFilterBarProps): React.ReactElement {
  return (
    <div className="grid gap-4 rounded-xl border border-border bg-surface p-4 shadow-xs md:grid-cols-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="employee-search">Search</Label>
        <Input
          id="employee-search"
          placeholder="Name, email, or ID"
          value={values.search}
          onChange={(event) =>
            onChange({ ...values, search: event.target.value })
          }
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="employee-country">Country</Label>
        <Input
          id="employee-country"
          placeholder="e.g. India"
          value={values.country}
          onChange={(event) =>
            onChange({ ...values, country: event.target.value })
          }
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="employee-type">Employment type</Label>
        <select
          id="employee-type"
          className={selectClassName}
          value={values.employmentType}
          onChange={(event) =>
            onChange({
              ...values,
              employmentType: event.target.value as EmploymentType | '',
            })
          }
        >
          <option value="">All types</option>
          {EMPLOYMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type === 'PartTime' ? 'Part-time' : type}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
