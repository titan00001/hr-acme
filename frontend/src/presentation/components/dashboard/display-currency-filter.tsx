import React from 'react';

import { DISPLAY_CURRENCY_ORIGINAL } from '@/domain/types/dashboard.types';
import { Label } from '@/presentation/components/ui/label';
import { cn } from '@/presentation/lib/cn';

export type DisplayCurrencyFilterProps = {
  value: string;
  currencies: string[];
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
};

export function DisplayCurrencyFilter({
  value,
  currencies,
  onChange,
  className,
  disabled = false,
}: DisplayCurrencyFilterProps): React.ReactElement {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor="display-currency">Display currency</Label>
      <select
        id="display-currency"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          'flex h-10 w-full max-w-xs rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink shadow-xs transition-theme',
          'focus-visible:border-brand focus-visible:shadow-focus focus-visible:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        <option value={DISPLAY_CURRENCY_ORIGINAL}>
          Original (per currency)
        </option>
        {currencies.map((code) => (
          <option key={code} value={code}>
            {code}
          </option>
        ))}
      </select>
    </div>
  );
}
