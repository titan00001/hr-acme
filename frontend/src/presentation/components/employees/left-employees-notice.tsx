import React from 'react';

import { cn } from '@/presentation/lib/cn';

export type LeftEmployeesNoticeProps = {
  className?: string;
};

export const LEFT_EMPLOYEES_NOTICE =
  'Left employees are excluded from dashboard payroll analytics.';

export function LeftEmployeesNotice({
  className,
}: LeftEmployeesNoticeProps): React.ReactElement {
  return (
    <aside
      className={cn(
        'rounded-xl border border-warning/40 bg-warning-soft px-4 py-3 text-sm text-warning',
        className,
      )}
      role="note"
    >
      {LEFT_EMPLOYEES_NOTICE}
    </aside>
  );
}
