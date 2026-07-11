import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { ProtectedRoute } from '@/infrastructure/routing/protected-route';
import { AuthLayout } from '@/presentation/components/layout/auth-layout';
import { AssignSalaryPage } from '@/presentation/pages/assign-salary-page';
import { DashboardPage } from '@/presentation/pages/dashboard-page';
import { DraftsPage } from '@/presentation/pages/drafts-page';
import { EditSalaryPage } from '@/presentation/pages/edit-salary-page';
import { EmployeeDetailPage } from '@/presentation/pages/employee-detail-page';
import { EmployeesPage } from '@/presentation/pages/employees-page';
import { LeftEmployeesPage } from '@/presentation/pages/left-employees-page';
import { LoginPage } from '@/presentation/pages/login-page';
import { SettingsPage } from '@/presentation/pages/settings-page';

export function AppRoutes(): React.ReactElement {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/employees/left" element={<LeftEmployeesPage />} />
            <Route path="/employees/:id" element={<EmployeeDetailPage />} />
            <Route
              path="/employees/:id/salary/create"
              element={<AssignSalaryPage />}
            />
            <Route
              path="/employees/:id/salary/edit"
              element={<EditSalaryPage />}
            />
            <Route path="/drafts" element={<DraftsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
