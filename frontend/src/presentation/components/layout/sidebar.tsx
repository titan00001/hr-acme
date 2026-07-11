import React from 'react';
import { NavLink } from 'react-router-dom';

import { sidebarNavItems } from '@/presentation/components/layout/sidebar-nav-items';
import { cn } from '@/presentation/lib/cn';

export function Sidebar(): React.ReactElement {
  return (
    <aside
      className="flex w-16 flex-col items-center gap-2 border-r border-border bg-surface py-4 md:w-56 md:items-stretch md:px-3"
      aria-label="Main navigation"
    >
      <nav className="flex flex-1 flex-col gap-1">
        {sidebarNavItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              aria-label={item.label}
              title={item.label}
              className={({ isActive }) =>
                cn(
                  'transition-theme flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium',
                  'justify-center md:justify-start',
                  isActive
                    ? 'bg-brand-soft text-brand-strong shadow-xs'
                    : 'text-ink-muted hover:bg-canvas-muted hover:text-ink',
                )
              }
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              <span className="hidden md:inline" aria-hidden>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
