import React from 'react';
import { Outlet } from 'react-router-dom';

import { GlobalHeader } from '@/presentation/components/layout/global-header';
import { Sidebar } from '@/presentation/components/layout/sidebar';

export function AuthLayout(): React.ReactElement {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <GlobalHeader />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <div className="animate-fade-in min-w-0 flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
