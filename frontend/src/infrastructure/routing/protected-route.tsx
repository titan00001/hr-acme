import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import { useAppSelector } from '@/infrastructure/store/hooks';

export function ProtectedRoute(): React.ReactElement {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
