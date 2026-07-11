import React from 'react';

import { cn } from '@/presentation/lib/cn';

type BadgeProps = {
  children: React.ReactNode;
  tone?: 'neutral' | 'brand' | 'success' | 'warning';
  className?: string;
};

const toneClass: Record<NonNullable<BadgeProps['tone']>, string> = {
  neutral: 'bg-canvas-muted text-ink-muted',
  brand: 'bg-brand-soft text-brand-strong',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
};

export function Badge({
  children,
  tone = 'neutral',
  className,
}: BadgeProps): React.ReactElement {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium',
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
