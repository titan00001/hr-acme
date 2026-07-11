import React, { useState } from 'react';

import { useGetSalaryDraftsQuery } from '@/infrastructure/api/salary-drafts-api';
import { PaginationControls } from '@/presentation/components/employees/pagination-controls';
import { ErrorHandler } from '@/presentation/components/feedback/error-handler';
import { PageHeader } from '@/presentation/components/layout/page-header';
import { DraftsTable } from '@/presentation/components/salary/drafts-table';

const PAGE_SIZE = 20;

export function DraftsPage(): React.ReactElement {
  const [page, setPage] = useState(1);
  const { data, isFetching, isError, error } = useGetSalaryDraftsQuery({
    page,
    limit: PAGE_SIZE,
    sortBy: 'updatedAt',
    sortOrder: 'DESC',
  });

  return (
    <main className="animate-slide-up space-y-4">
      <PageHeader
        title="Drafts"
        description="Review pending salary changes — commit to apply or rollback to discard."
      />

      {isError ? (
        <ErrorHandler error={error} defaultMessage="Unable to load drafts" />
      ) : (
        <>
          <DraftsTable
            rows={data?.data ?? []}
            isLoading={isFetching && !data}
          />
          {data ? (
            <PaginationControls
              page={data.page}
              totalPages={data.totalPages}
              total={data.total}
              onPageChange={setPage}
            />
          ) : null}
        </>
      )}
    </main>
  );
}
