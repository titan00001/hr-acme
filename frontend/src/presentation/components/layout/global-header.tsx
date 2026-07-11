import { LogOut, Settings } from 'lucide-react';
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAppDispatch } from '@/infrastructure/store/hooks';
import { logout } from '@/infrastructure/store/auth-slice';
import { Button } from '@/presentation/components/ui/button';

export function GlobalHeader(): React.ReactElement {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  function handleLogout(): void {
    dispatch(logout());
    void navigate('/login');
  }

  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-surface px-4 py-3 shadow-xs md:px-6">
      <div className="min-w-0">
        <p className="font-display text-lg font-semibold tracking-tight text-ink md:text-xl">
          ACME HR
        </p>
        <p className="truncate text-sm text-ink-muted">Salary management</p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Link
          to="/settings"
          className="transition-theme inline-flex h-8 items-center gap-2 rounded-sm px-3 text-xs font-medium text-ink-muted hover:bg-canvas-muted hover:text-ink"
        >
          <Settings className="size-4" aria-hidden />
          <span className="hidden sm:inline">Settings</span>
        </Link>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleLogout}
        >
          <LogOut className="size-4" aria-hidden />
          <span className="hidden sm:inline">Log out</span>
        </Button>
      </div>
    </header>
  );
}
