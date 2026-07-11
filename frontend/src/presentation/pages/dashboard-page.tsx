import React, { useMemo, useState } from 'react';

import { defaultTrendsRange } from '@/domain/formatters/iso-date';
import { DISPLAY_CURRENCY_ORIGINAL } from '@/domain/types/dashboard.types';
import {
  useGetDashboardByCountryQuery,
  useGetDashboardDistributionQuery,
  useGetDashboardSummaryQuery,
  useGetDashboardTrendsQuery,
  useGetRecentRevisionsQuery,
} from '@/infrastructure/api/dashboard-api';
import { useGetSettingsQuery } from '@/infrastructure/api/settings-api';
import { CompensationTrendsChart } from '@/presentation/components/dashboard/compensation-trends-chart';
import { CountryBreakdownTable } from '@/presentation/components/dashboard/country-breakdown-table';
import { DisplayCurrencyFilter } from '@/presentation/components/dashboard/display-currency-filter';
import { RecentRevisionsList } from '@/presentation/components/dashboard/recent-revisions-list';
import { SalaryDistributionChart } from '@/presentation/components/dashboard/salary-distribution-chart';
import { SummaryCards } from '@/presentation/components/dashboard/summary-cards';
import { LeftEmployeesNotice } from '@/presentation/components/employees/left-employees-notice';
import { PaginationControls } from '@/presentation/components/employees/pagination-controls';
import { ErrorHandler } from '@/presentation/components/feedback/error-handler';
import { PageHeader } from '@/presentation/components/layout/page-header';

const RECENT_REVISIONS_PAGE_SIZE = 10;

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl text-ink">{title}</h2>
      {children}
    </section>
  );
}

export function DashboardPage(): React.ReactElement {
  const [displayCurrency, setDisplayCurrency] = useState(
    DISPLAY_CURRENCY_ORIGINAL,
  );
  const [trendsRange, setTrendsRange] = useState(defaultTrendsRange);
  const [revisionsPage, setRevisionsPage] = useState(1);

  const currencyQuery = useMemo(
    () => ({ displayCurrency }),
    [displayCurrency],
  );
  const trendsQuery = useMemo(
    () => ({
      displayCurrency,
      from: trendsRange.from,
      to: trendsRange.to,
    }),
    [displayCurrency, trendsRange.from, trendsRange.to],
  );
  const revisionsQueryArgs = useMemo(
    () => ({ page: revisionsPage, limit: RECENT_REVISIONS_PAGE_SIZE }),
    [revisionsPage],
  );

  const settingsQuery = useGetSettingsQuery();
  const summaryQuery = useGetDashboardSummaryQuery(currencyQuery);
  const byCountryQuery = useGetDashboardByCountryQuery(currencyQuery);
  const distributionQuery = useGetDashboardDistributionQuery(currencyQuery);
  const trendsApiQuery = useGetDashboardTrendsQuery(trendsQuery);
  const revisionsQuery = useGetRecentRevisionsQuery(revisionsQueryArgs);

  const currencies = settingsQuery.data?.supportedCurrencies ?? [];

  const loadError =
    summaryQuery.error ??
    byCountryQuery.error ??
    distributionQuery.error ??
    trendsApiQuery.error ??
    revisionsQuery.error ??
    settingsQuery.error;

  return (
    <main className="animate-slide-up space-y-8">
      <PageHeader
        title="Dashboard"
        description="Active-employee payroll analytics — drafts are excluded until committed."
        actions={
          <DisplayCurrencyFilter
            value={displayCurrency}
            currencies={currencies}
            onChange={setDisplayCurrency}
            disabled={settingsQuery.isLoading}
          />
        }
      />

      <LeftEmployeesNotice />

      {loadError ? (
        <ErrorHandler
          error={loadError}
          defaultMessage="Unable to load dashboard"
        />
      ) : null}

      <Section title="Summary">
        <SummaryCards
          summary={summaryQuery.data}
          isLoading={summaryQuery.isFetching && !summaryQuery.data}
        />
      </Section>

      <Section title="By country">
        <CountryBreakdownTable
          rows={byCountryQuery.data ?? []}
          isLoading={byCountryQuery.isFetching && !byCountryQuery.data}
        />
      </Section>

      <div className="grid gap-8 lg:grid-cols-2">
        <Section title="Salary distribution">
          <SalaryDistributionChart
            buckets={distributionQuery.data ?? []}
            isLoading={
              distributionQuery.isFetching && !distributionQuery.data
            }
          />
        </Section>

        <Section title="Compensation trends">
          <CompensationTrendsChart
            points={trendsApiQuery.data ?? []}
            from={trendsRange.from}
            to={trendsRange.to}
            onRangeChange={setTrendsRange}
            isLoading={trendsApiQuery.isFetching && !trendsApiQuery.data}
          />
        </Section>
      </div>

      <Section title="Recent revisions">
        <RecentRevisionsList
          rows={revisionsQuery.data?.data ?? []}
          isLoading={revisionsQuery.isFetching && !revisionsQuery.data}
        />
        {revisionsQuery.data ? (
          <PaginationControls
            page={revisionsQuery.data.page}
            totalPages={revisionsQuery.data.totalPages}
            total={revisionsQuery.data.total}
            onPageChange={setRevisionsPage}
          />
        ) : null}
      </Section>
    </main>
  );
}
