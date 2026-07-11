import React from 'react';

import { cn } from '@/presentation/lib/cn';

export type ErrorAlertProps = {
  message: string;
  className?: string;
};

/** Default Harbor Ink error card used by ErrorHandler. */
export function ErrorAlert({
  message,
  className,
}: ErrorAlertProps): React.ReactElement {
  return (
    <div
      className={cn(
        'rounded-xl border border-danger/30 bg-danger-soft p-4 text-sm text-danger',
        className,
      )}
      role="alert"
    >
      {message}
    </div>
  );
}
