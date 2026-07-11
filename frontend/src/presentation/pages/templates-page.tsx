import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { TemplateQuery } from '@/domain/types/salary-template.types';
import type { SalaryTemplate } from '@/domain/types/salary-template.types';
import { useGetSalaryTemplatesQuery } from '@/infrastructure/api/salary-templates-api';
import { PaginationControls } from '@/presentation/components/employees/pagination-controls';
import { ErrorHandler } from '@/presentation/components/feedback/error-handler';
import { PageHeader } from '@/presentation/components/layout/page-header';
import { CreateTemplateDialog } from '@/presentation/components/salary/create-template-dialog';
import { CreateTemplateVersionDialog } from '@/presentation/components/salary/create-template-version-dialog';
import { DeleteTemplateDialog } from '@/presentation/components/salary/delete-template-dialog';
import { EditTemplateDialog } from '@/presentation/components/salary/edit-template-dialog';
import {
  TemplateFilterBar,
  type TemplateFilterValues,
} from '@/presentation/components/salary/template-filter-bar';
import { TemplatesTable } from '@/presentation/components/salary/templates-table';
import { Button } from '@/presentation/components/ui/button';
import { useDebouncedValue } from '@/presentation/hooks/use-debounced-value';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

const initialFilters: TemplateFilterValues = {
  search: '',
  country: '',
  currency: '',
  isAssigned: '',
};

export function TemplatesPage(): React.ReactElement {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<TemplateFilterValues>(initialFilters);
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SalaryTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SalaryTemplate | null>(null);
  const [versionTarget, setVersionTarget] = useState<SalaryTemplate | null>(
    null,
  );

  const debouncedSearch = useDebouncedValue(filters.search, SEARCH_DEBOUNCE_MS);
  const debouncedCountry = useDebouncedValue(
    filters.country,
    SEARCH_DEBOUNCE_MS,
  );
  const debouncedCurrency = useDebouncedValue(
    filters.currency,
    SEARCH_DEBOUNCE_MS,
  );

  const query = useMemo((): TemplateQuery => {
    return {
      page,
      limit: PAGE_SIZE,
      sortBy: 'name',
      sortOrder: 'ASC',
      ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
      ...(debouncedCountry.trim() ? { country: debouncedCountry.trim() } : {}),
      ...(debouncedCurrency.trim()
        ? { currency: debouncedCurrency.trim().toUpperCase() }
        : {}),
      ...(filters.isAssigned === 'true'
        ? { isAssigned: true }
        : filters.isAssigned === 'false'
          ? { isAssigned: false }
          : {}),
    };
  }, [
    page,
    debouncedSearch,
    debouncedCountry,
    debouncedCurrency,
    filters.isAssigned,
  ]);

  const { data, isFetching, isError, error } = useGetSalaryTemplatesQuery(query);

  function handleFiltersChange(next: TemplateFilterValues): void {
    setFilters(next);
    setPage(1);
  }

  return (
    <main className="animate-slide-up">
      <PageHeader
        title="Templates"
        description="Versioned salary blueprints — unused versions can be edited or deleted."
        actions={
          <Button type="button" onClick={() => setCreateOpen(true)}>
            Create template
          </Button>
        }
      />

      <TemplateFilterBar values={filters} onChange={handleFiltersChange} />

      <div className="mt-4">
        {isError ? (
          <ErrorHandler
            error={error}
            defaultMessage="Unable to load salary templates"
          />
        ) : (
          <>
            <TemplatesTable
              rows={data?.data ?? []}
              isLoading={isFetching && !data}
              onRowClick={(template) => {
                void navigate(`/templates/${template.id}`);
              }}
              onEdit={setEditTarget}
              onDelete={setDeleteTarget}
              onCreateVersion={setVersionTarget}
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

      <CreateTemplateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={(id) => {
          void navigate(`/templates/${id}`);
        }}
      />
      <EditTemplateDialog
        open={editTarget !== null}
        template={editTarget}
        onClose={() => setEditTarget(null)}
      />
      <DeleteTemplateDialog
        open={deleteTarget !== null}
        template={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
      <CreateTemplateVersionDialog
        open={versionTarget !== null}
        template={versionTarget}
        onClose={() => setVersionTarget(null)}
        onSuccess={(id) => {
          void navigate(`/templates/${id}`);
        }}
      />
    </main>
  );
}
