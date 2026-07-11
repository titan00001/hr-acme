import React from 'react';

import { cn } from '@/presentation/lib/cn';

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, ...props }: LabelProps): React.ReactElement {
  return (
    <label
      className={cn(
        'text-sm font-medium text-ink peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}
