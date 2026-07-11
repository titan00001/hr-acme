import React from 'react';

import { formatDate } from '@/domain/formatters/date';
import type { Employee } from '@/domain/types/employee.types';
import { Badge } from '@/presentation/components/ui/badge';

export type EmployeeInfoCardProps = {
  employee: Employee;
};

export function EmployeeInfoCard({
  employee,
}: EmployeeInfoCardProps): React.ReactElement {
  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-xs">
      <h2 className="font-display text-xl text-ink">Profile</h2>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-ink-subtle">
            Employee ID
          </dt>
          <dd className="text-ink">{employee.employeeId}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-ink-subtle">
            Status
          </dt>
          <dd>
            <Badge tone={employee.status === 'Active' ? 'success' : 'warning'}>
              {employee.status}
            </Badge>
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-ink-subtle">
            Email
          </dt>
          <dd className="text-ink">{employee.email}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-ink-subtle">
            Country
          </dt>
          <dd className="text-ink">{employee.country}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-ink-subtle">
            Employment type
          </dt>
          <dd className="text-ink">
            {employee.employmentType === 'PartTime'
              ? 'Part-time'
              : employee.employmentType}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-ink-subtle">
            Joining date
          </dt>
          <dd className="text-ink">{formatDate(employee.joiningDate)}</dd>
        </div>
      </dl>
    </section>
  );
}
