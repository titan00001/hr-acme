import React from 'react';

import type { SalaryTemplate } from '@/domain/types/salary-template.types';
import { useGetSalaryTemplatesQuery } from '@/infrastructure/api/salary-templates-api';
import { Label } from '@/presentation/components/ui/label';

const selectClassName =
  'flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink shadow-xs transition-theme focus-visible:border-brand focus-visible:shadow-focus focus-visible:outline-none';

export type TemplatePickerProps = {
  country?: string;
  value?: string;
  onChange: (template: SalaryTemplate | null) => void;
  disabled?: boolean;
};

export function TemplatePicker({
  country,
  value,
  onChange,
  disabled = false,
}: TemplatePickerProps): React.ReactElement {
  const { data, isFetching } = useGetSalaryTemplatesQuery({
    page: 1,
    limit: 100,
    ...(country ? { country } : {}),
  });

  const templates = data?.data ?? [];

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="template-picker">Salary template (optional)</Label>
      <select
        id="template-picker"
        className={selectClassName}
        disabled={disabled || isFetching}
        value={value ?? ''}
        onChange={(event) => {
          const id = event.target.value;
          if (!id) {
            onChange(null);
            return;
          }
          const selected = templates.find((template) => template.id === id) ?? null;
          onChange(selected);
        }}
      >
        <option value="">No template — blank form</option>
        {templates.map((template) => (
          <option key={template.id} value={template.id}>
            {template.name} v{template.version} ({template.currency})
          </option>
        ))}
      </select>
      {isFetching ? (
        <p className="text-xs text-ink-subtle">Loading templates…</p>
      ) : null}
    </div>
  );
}
