import React from 'react';
import { Link } from 'react-router-dom';

import type { Employee } from '@/domain/types/employee.types';
import { Button } from '@/presentation/components/ui/button';

export type EmployeeActionBarProps = {
  employee: Employee;
  onRelieve: () => void;
};

export function EmployeeActionBar({
  employee,
  onRelieve,
}: EmployeeActionBarProps): React.ReactElement {
  const isActive = employee.status === 'Active';
  const salaryPath = `/employees/${employee.id}/salary/${employee.currentSalaryId ? 'edit' : 'create'}`;

  return (
    <div className="flex flex-wrap gap-2">
      {isActive ? (
        <>
          <Link
            to={salaryPath}
            className="inline-flex h-8 items-center rounded-sm bg-brand px-3 text-xs font-medium text-surface transition-theme hover:bg-brand-strong"
          >
            {employee.currentSalaryId ? 'Edit salary' : 'Assign salary'}
          </Link>
          <Button type="button" variant="danger" size="sm" onClick={onRelieve}>
            Relieve
          </Button>
        </>
      ) : (
        <p className="text-sm text-ink-muted">
          This employee has left — salary history remains available.
        </p>
      )}
    </div>
  );
}
