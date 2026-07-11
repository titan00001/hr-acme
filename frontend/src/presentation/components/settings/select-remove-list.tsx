import { X } from 'lucide-react';
import React, { useId, useState } from 'react';

import { Button } from '@/presentation/components/ui/button';
import { Label } from '@/presentation/components/ui/label';
import { cn } from '@/presentation/lib/cn';

export type SelectRemoveListProps = {
  id?: string;
  label: string;
  hint?: string;
  values: string[];
  options: readonly string[];
  emptyLabel?: string;
  addLabel?: string;
  onChange: (next: string[]) => void;
  className?: string;
};

/**
 * Compact multi-value editor: select + add, selected items as removable chips.
 */
export function SelectRemoveList({
  id: idProp,
  label,
  hint,
  values,
  options,
  emptyLabel = 'Nothing selected yet.',
  addLabel = 'Add',
  onChange,
  className,
}: SelectRemoveListProps): React.ReactElement {
  const autoId = useId();
  const selectId = idProp ?? autoId;
  const [pending, setPending] = useState('');

  const available = options.filter((option) => !values.includes(option));

  function handleAdd(): void {
    if (!pending || values.includes(pending)) {
      return;
    }
    onChange([...values, pending]);
    setPending('');
  }

  function handleRemove(value: string): void {
    onChange(values.filter((item) => item !== value));
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={selectId} className="text-xs">
          {label}
        </Label>
        {hint ? (
          <span className="truncate text-[11px] text-ink-subtle" title={hint}>
            {hint}
          </span>
        ) : null}
      </div>

      <div className="flex gap-1.5">
        <select
          id={selectId}
          value={pending}
          disabled={available.length === 0}
          onChange={(event) => setPending(event.target.value)}
          className={cn(
            'flex h-8 min-w-0 flex-1 rounded-sm border border-border bg-surface px-2 text-xs text-ink shadow-xs transition-theme',
            'focus-visible:border-brand focus-visible:shadow-focus focus-visible:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          <option value="">
            {available.length === 0 ? 'All added' : 'Select…'}
          </option>
          {available.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!pending}
          onClick={handleAdd}
        >
          {addLabel}
        </Button>
      </div>

      {values.length === 0 ? (
        <p className="text-xs text-ink-muted">{emptyLabel}</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {values.map((value) => (
            <li key={value}>
              <span className="inline-flex items-center gap-0.5 rounded-sm border border-border bg-surface-raised py-0.5 pl-2 pr-0.5 text-xs font-medium text-ink">
                {value}
                <button
                  type="button"
                  aria-label={`Remove ${value}`}
                  onClick={() => handleRemove(value)}
                  className="inline-flex size-5 items-center justify-center rounded-sm text-ink-muted transition-theme hover:bg-canvas-muted hover:text-ink"
                >
                  <X className="size-3" aria-hidden />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
