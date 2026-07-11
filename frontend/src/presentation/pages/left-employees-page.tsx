import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { EmployeeQuery } from '@/domain/types/employee.types';
import { useGetLeftEmployeesQuery } from '@/infrastructure/api/employees-api';
import {
  EmployeeFilterBar,
  type EmployeeFilterValues,
} from '@/presentation/components/employees/employee-filter-bar';
import { EmployeeTable } from '@/presentation/components/employees/employee-table';
import { LeftEmployeesNotice } from '@/presentation/components/employees/left-employees-notice';
import { PaginationControls } from '@/presentation/components/employees/pagination-controls';
import { ErrorHandler } from '@/presentation/components/feedback/error-handler';
import { PageHeader } from '@/presentation/components/layout/page-header';
import { useDebouncedValue } from '@/presentation/hooks/use-debounced-value';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

const initialFilters: EmployeeFilterValues = {
  search: '',
  country: '',
  employmentType: '',
};

export function LeftEmployeesPage(): React.ReactElement {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<EmployeeFilterValues>(initialFilters);
  const [page, setPage] = useState(1);
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

  const { data, isFetching, isError, error } = useGetLeftEmployeesQuery(query);

  function handleFiltersChange(next: EmployeeFilterValues): void {
    setFilters(next);
    setPage(1);
  }

  return (
    <main className="animate-slide-up space-y-4">
      <PageHeader
        title="Left employees"
        description="Relieved employees — salary history remains available on their profile."
      />

      <LeftEmployeesNotice />

      <EmployeeFilterBar values={filters} onChange={handleFiltersChange} />

      <div>
        {isError ? (
          <ErrorHandler
            error={error}
            defaultMessage="Unable to load left employees"
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
    </main>
  );
}
