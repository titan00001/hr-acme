import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';

import { cn } from '@/presentation/lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-theme focus-visible:outline-none focus-visible:shadow-focus disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-brand text-surface hover:bg-brand-strong shadow-xs',
        secondary:
          'bg-brand-soft text-brand-strong hover:bg-brand-soft/80 border border-border',
        outline:
          'border border-border bg-surface text-ink hover:bg-surface-raised',
        ghost: 'text-ink-muted hover:bg-canvas-muted hover:text-ink',
        danger: 'bg-danger text-surface hover:bg-danger/90',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-sm px-3 text-xs',
        lg: 'h-11 rounded-md px-6',
        full: 'h-11 w-full px-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ className, variant, size, type = 'button', ...props }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
