import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { EmployeeQuery } from '@/domain/types/employee.types';
import { useGetEmployeesQuery } from '@/infrastructure/api/employees-api';
import {
  EmployeeFilterBar,
  type EmployeeFilterValues,
} from '@/presentation/components/employees/employee-filter-bar';
import { EmployeeTable } from '@/presentation/components/employees/employee-table';
import { OnboardModal } from '@/presentation/components/employees/onboard-modal';
import { PaginationControls } from '@/presentation/components/employees/pagination-controls';
import { ErrorHandler } from '@/presentation/components/feedback/error-handler';
import { PageHeader } from '@/presentation/components/layout/page-header';
import { Button } from '@/presentation/components/ui/button';
import { useDebouncedValue } from '@/presentation/hooks/use-debounced-value';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

const initialFilters: EmployeeFilterValues = {
  search: '',
  country: '',
  employmentType: '',
};

export function EmployeesPage(): React.ReactElement {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<EmployeeFilterValues>(initialFilters);
  const [page, setPage] = useState(1);
  const [onboardOpen, setOnboardOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(filters.search, SEARCH_DEBOUNCE_MS);
  const debouncedCountry = useDebouncedValue(
    filters.country,
    SEARCH_DEBOUNCE_MS,
  );

  const query = useMemo((): EmployeeQuery => {
    return {
      page,
      limit: PAGE_SIZE,
      sortBy: 'name',
      sortOrder: 'ASC',
      ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
      ...(debouncedCountry.trim() ? { country: debouncedCountry.trim() } : {}),
      ...(filters.employmentType
        ? { employmentType: filters.employmentType }
        : {}),
    };
  }, [page, debouncedSearch, debouncedCountry, filters.employmentType]);

  const { data, isFetching, isError, error } = useGetEmployeesQuery(query);

  function handleFiltersChange(next: EmployeeFilterValues): void {
    setFilters(next);
    setPage(1);
  }

  return (
    <main className="animate-slide-up">
      <PageHeader
        title="Employees"
        description="Active directory — salary shown in original currency."
        actions={
          <Button type="button" onClick={() => setOnboardOpen(true)}>
            Onboard employee
          </Button>
        }
      />

      <EmployeeFilterBar values={filters} onChange={handleFiltersChange} />

      <div className="mt-4">
        {isError ? (
          <ErrorHandler
            error={error}
            defaultMessage="Unable to load employees"
          />
        ) : (
          <>
            <EmployeeTable
              rows={data?.data ?? []}
              isLoading={isFetching && !data}
              onRowClick={(employee) => {
                void navigate(`/employees/${employee.id}`);
              }}
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
      </div>

      <OnboardModal
        open={onboardOpen}
        onClose={() => setOnboardOpen(false)}
        onSuccess={(employeeId) => {
          void navigate(`/employees/${employeeId}`);
        }}
      />
    </main>
  );
}
