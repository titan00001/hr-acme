import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useGetEmployeeQuery } from '@/infrastructure/api/employees-api';
import { useGetSalaryHistoryQuery } from '@/infrastructure/api/salary-api';
import { CurrentSalaryCard } from '@/presentation/components/employees/current-salary-card';
import { EmployeeActionBar } from '@/presentation/components/employees/employee-action-bar';
import { EmployeeInfoCard } from '@/presentation/components/employees/employee-info-card';
import { RelieveModal } from '@/presentation/components/employees/relieve-modal';
import { SalaryHistoryTimeline } from '@/presentation/components/employees/salary-history-timeline';
import { ErrorHandler } from '@/presentation/components/feedback/error-handler';
import { PageHeader } from '@/presentation/components/layout/page-header';

export function EmployeeDetailPage(): React.ReactElement {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [relieveOpen, setRelieveOpen] = useState(false);

  const {
    data: employee,
    isLoading,
    isError,
    error,
  } = useGetEmployeeQuery(id, { skip: !id });

  const { data: history, isFetching: historyLoading } = useGetSalaryHistoryQuery(
    { employeeId: id, query: { page: 1, limit: 50, sortBy: 'effectiveDate', sortOrder: 'DESC' } },
    { skip: !id },
  );

  if (isLoading) {
    return (
      <main className="animate-slide-up">
        <p className="text-ink-muted" role="status">
          Loading employee…
        </p>
      </main>
    );
  }

  if (isError || !employee) {
    return (
      <main className="animate-slide-up space-y-4">
        <ErrorHandler
          error={error ?? { status: 404 }}
          defaultMessage="Unable to load employee"
        />
        <Link to="/employees" className="text-sm text-brand hover:underline">
          Back to employees
        </Link>
      </main>
    );
  }

  const latestRecord = history?.data[0] ?? null;

  return (
    <main className="animate-slide-up space-y-6">
      <PageHeader
        title={employee.name}
        description={`${employee.employeeId} · ${employee.email}`}
        actions={
          <EmployeeActionBar
            employee={employee}
            onRelieve={() => setRelieveOpen(true)}
          />
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <EmployeeInfoCard employee={employee} />
        <CurrentSalaryCard
          summary={employee.currentSalary}
          latestRecord={latestRecord}
        />
      </div>

      <SalaryHistoryTimeline
        records={history?.data ?? []}
        isLoading={historyLoading && !history}
      />

      <RelieveModal
        open={relieveOpen}
        employeeId={employee.id}
        employeeName={employee.name}
        onClose={() => setRelieveOpen(false)}
        onSuccess={() => {
          void navigate('/employees/left');
        }}
      />
    </main>
  );
}
