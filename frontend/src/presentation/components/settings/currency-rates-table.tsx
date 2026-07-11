import React from 'react';

import { formatDate } from '@/domain/formatters/date';
import type { CurrencyRate } from '@/domain/types/settings.types';
import { formatApiErrorMessage } from '@/infrastructure/api/extract-api-error';
import { useSyncCurrencyRatesMutation } from '@/infrastructure/api/currency-rates-api';
import { Button } from '@/presentation/components/ui/button';

export type CurrencyRatesTableProps = {
  rates: CurrencyRate[];
  lastFxSyncAt: string | null;
  isLoading?: boolean;
};

export function CurrencyRatesTable({
  rates,
  lastFxSyncAt,
  isLoading = false,
}: CurrencyRatesTableProps): React.ReactElement {
  const [syncRates, syncState] = useSyncCurrencyRatesMutation();

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface p-4 shadow-xs">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-muted">
          Last FX sync:{' '}
          <span className="font-medium text-ink">
            {lastFxSyncAt ? formatDate(lastFxSyncAt) : 'Never'}
          </span>
        </p>
        <Button
          type="button"
          onClick={() => {
            void syncRates();
          }}
          disabled={syncState.isLoading}
        >
          {syncState.isLoading ? 'Syncing…' : 'Sync rates'}
        </Button>
      </div>

      {syncState.error ? (
        <p className="text-sm text-danger" role="alert">
          {formatApiErrorMessage(syncState.error, 'FX sync failed')}
        </p>
      ) : null}
      {syncState.isSuccess ? (
        <p className="text-sm text-success" role="status">
          Synced {syncState.data.synced} rates.
        </p>
      ) : null}

      {isLoading ? (
        <p className="py-6 text-center text-ink-muted" role="status">
          Loading currency rates…
        </p>
      ) : rates.length === 0 ? (
        <p className="py-6 text-center text-ink-muted">
          No rates yet. Sync to pull from the exchange-rate provider.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-left text-sm">
            <thead className="border-b border-border bg-surface-raised text-ink-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Base</th>
                <th className="px-3 py-2 font-medium">Target</th>
                <th className="px-3 py-2 font-medium">Rate</th>
                <th className="px-3 py-2 font-medium">Synced</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((rate) => (
                <tr
                  key={rate.id}
                  className="border-b border-border last:border-b-0"
                >
                  <td className="px-3 py-2 font-mono text-ink">
                    {rate.baseCurrency}
                  </td>
                  <td className="px-3 py-2 font-mono text-ink">
                    {rate.targetCurrency}
                  </td>
                  <td className="px-3 py-2 font-mono text-ink">{rate.rate}</td>
                  <td className="px-3 py-2 text-ink-muted">
                    {formatDate(rate.syncedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
