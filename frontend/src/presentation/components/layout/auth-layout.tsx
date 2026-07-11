import React from 'react';
import { Outlet } from 'react-router-dom';

/** Shell placeholder — full header/sidebar arrives in M3.3. */
export function AuthLayout(): React.ReactElement {
  return (
    <div className="auth-layout">
      <Outlet />
    </div>
  );
}
