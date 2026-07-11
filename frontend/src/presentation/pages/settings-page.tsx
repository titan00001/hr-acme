import React from 'react';

import { useGetCurrencyRatesQuery } from '@/infrastructure/api/currency-rates-api';
import { useGetDemoStatusQuery } from '@/infrastructure/api/demo-api';
import { useGetSettingsQuery } from '@/infrastructure/api/settings-api';
import { CurrencyRatesTable } from '@/presentation/components/settings/currency-rates-table';
import { DemoSettingsSection } from '@/presentation/components/settings/demo-settings-section';
import { GeneralSettingsForm } from '@/presentation/components/settings/general-settings-form';
import { StockSettingsForm } from '@/presentation/components/settings/stock-settings-form';
import { ErrorHandler } from '@/presentation/components/feedback/error-handler';
import { PageHeader } from '@/presentation/components/layout/page-header';

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-display text-xl text-ink">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-ink-muted">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function SettingsPage(): React.ReactElement {
  const settingsQuery = useGetSettingsQuery();
  const ratesQuery = useGetCurrencyRatesQuery();
  const demoQuery = useGetDemoStatusQuery();

  const loadError =
    settingsQuery.error ?? ratesQuery.error ?? demoQuery.error;

  return (
    <main className="animate-slide-up space-y-8">
      <PageHeader
        title="Settings"
        description="Company config, FX rates, stock price, and demo data tools."
      />

      {loadError ? (
        <ErrorHandler
          error={loadError}
          defaultMessage="Unable to load settings"
        />
      ) : null}

      <Section
        title="General"
        description="Base currency and supported countries / currencies."
      >
        {settingsQuery.isFetching && !settingsQuery.data ? (
          <p className="text-sm text-ink-muted" role="status">
            Loading settings…
          </p>
        ) : settingsQuery.data ? (
          <GeneralSettingsForm
            key={`general-${settingsQuery.data.baseCurrency}-${settingsQuery.data.supportedCurrencies.join(',')}-${settingsQuery.data.supportedCountries.join(',')}`}
            settings={settingsQuery.data}
          />
        ) : null}
      </Section>

      <Section
        title="Stock"
        description="Company-wide stock pool used when assigning equity components."
      >
        {settingsQuery.data ? (
          <StockSettingsForm
            key={`stock-${settingsQuery.data.totalStocks}-${settingsQuery.data.stockPrice}-${settingsQuery.data.stockPriceCurrency}`}
            settings={settingsQuery.data}
          />
        ) : null}
      </Section>

      <Section
        title="Currency rates"
        description="Synced FX table used when the dashboard display currency is not original."
      >
        <CurrencyRatesTable
          rates={ratesQuery.data ?? []}
          lastFxSyncAt={settingsQuery.data?.lastFxSyncAt ?? null}
          isLoading={ratesQuery.isFetching && !ratesQuery.data}
        />
      </Section>

      <Section title="Demo data">
        <DemoSettingsSection
          status={demoQuery.data}
          isLoading={demoQuery.isFetching && !demoQuery.data}
        />
      </Section>
    </main>
  );
}
