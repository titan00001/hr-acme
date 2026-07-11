import React, { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import type { SalaryDraftFormValues } from '@/domain/schemas/salary-draft-form.schema';
import type { UpsertSalaryDraftRequest } from '@/domain/types/salary.types';
import { formatApiErrorMessage } from '@/infrastructure/api/extract-api-error';
import { useGetEmployeeQuery } from '@/infrastructure/api/employees-api';
import { useUpsertSalaryDraftMutation } from '@/infrastructure/api/salary-drafts-api';
import { useGetSalaryHistoryQuery } from '@/infrastructure/api/salary-api';
import { useGetSettingsQuery } from '@/infrastructure/api/settings-api';
import { ErrorHandler } from '@/presentation/components/feedback/error-handler';
import { PageHeader } from '@/presentation/components/layout/page-header';
import { SalaryForm } from '@/presentation/components/salary/salary-form';

export type SalaryDraftPageMode = 'assign' | 'edit';

export type SalaryDraftPageProps = {
  mode: SalaryDraftPageMode;
};

function readComponentNumber(
  components: Record<string, unknown>,
  key: string,
): number | undefined {
  const value = components[key];
  return typeof value === 'number' ? value : undefined;
}

function readStockQuantity(
  components: Record<string, unknown>,
): number | undefined {
  const stock = components.stock;
  if (typeof stock !== 'object' || stock === null) {
    return undefined;
  }
  const quantity = (stock as { quantity?: unknown }).quantity;
  return typeof quantity === 'number' ? quantity : undefined;
}

function readStockVestingDate(
  components: Record<string, unknown>,
): string | undefined {
  const stock = components.stock;
  if (typeof stock !== 'object' || stock === null) {
    return undefined;
  }
  const vestingDate = (stock as { vestingDate?: unknown }).vestingDate;
  return typeof vestingDate === 'string' ? vestingDate : undefined;
}

export function SalaryDraftPage({
  mode,
}: SalaryDraftPageProps): React.ReactElement {
  const { id: employeeId = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: employee,
    isLoading: employeeLoading,
    isError: employeeError,
    error: employeeErr,
  } = useGetEmployeeQuery(employeeId, { skip: !employeeId });

  const { data: settings } = useGetSettingsQuery();
  const { data: history } = useGetSalaryHistoryQuery(
    {
      employeeId,
      query: { page: 1, limit: 1, sortBy: 'effectiveDate', sortOrder: 'DESC' },
    },
    { skip: !employeeId || mode !== 'edit' },
  );

  const [upsertDraft, { isLoading, error, reset }] =
    useUpsertSalaryDraftMutation();

  const latest = history?.data[0];

  const defaultValues = useMemo((): Partial<SalaryDraftFormValues> | undefined => {
    if (mode !== 'edit' || !latest) {
      return {
        currency: settings?.supportedCurrencies[0] ?? 'USD',
        paymentCycle: 'Monthly',
      };
    }

    return {
      templateId: latest.templateId ?? '',
      effectiveDate: latest.effectiveDate,
      baseSalary: Number(latest.baseSalary),
      currency: latest.currency,
      paymentCycle: latest.paymentCycle,
      allowances: readComponentNumber(latest.components, 'allowances'),
      bonus: readComponentNumber(latest.components, 'bonus'),
      stockQuantity: readStockQuantity(latest.components),
      stockVestingDate: readStockVestingDate(latest.components) ?? '',
      reason: '',
    };
  }, [mode, latest, settings?.supportedCurrencies]);

  async function handleSubmit(body: UpsertSalaryDraftRequest): Promise<void> {
    reset();
    try {
      await upsertDraft({ employeeId, body }).unwrap();
      void navigate('/drafts');
    } catch {
      // Surfaced via mutation error
    }
  }

  if (employeeLoading) {
    return (
      <main className="animate-slide-up">
        <p className="text-ink-muted" role="status">
          Loading employee…
        </p>
      </main>
    );
  }

  if (employeeError || !employee) {
    return (
      <main className="animate-slide-up space-y-4">
        <ErrorHandler
          error={employeeErr ?? { status: 404 }}
          defaultMessage="Unable to load employee"
        />
        <Link to="/employees" className="text-sm text-brand hover:underline">
          Back to employees
        </Link>
      </main>
    );
  }

  const currencies =
    settings?.supportedCurrencies?.length
      ? settings.supportedCurrencies
      : [latest?.currency ?? 'USD'];

  return (
    <main className="animate-slide-up mx-auto max-w-2xl space-y-6">
      <PageHeader
        title={mode === 'assign' ? 'Assign salary' : 'Edit salary'}
        description={`${employee.name} · saves as a draft (not committed)`}
      />

      <section className="rounded-xl border border-border bg-surface p-6 shadow-xs">
        <SalaryForm
          country={employee.country}
          currencies={currencies}
          defaultValues={defaultValues}
          isSubmitting={isLoading}
          serverError={
            error
              ? formatApiErrorMessage(error, 'Unable to save salary draft')
              : null
          }
          submitLabel="Save draft"
          onCancel={() => {
            void navigate(`/employees/${employee.id}`);
          }}
          onSubmit={handleSubmit}
        />
      </section>
    </main>
  );
}
