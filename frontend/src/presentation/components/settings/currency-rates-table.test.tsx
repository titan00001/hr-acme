import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CurrencyRatesTable } from './currency-rates-table';

const syncRates = vi.fn();

vi.mock('@/infrastructure/api/currency-rates-api', () => ({
  useSyncCurrencyRatesMutation: () => [
    syncRates,
    { isLoading: false, error: undefined, isSuccess: false, data: undefined },
  ],
}));

describe('CurrencyRatesTable', () => {
  beforeEach(() => {
    syncRates.mockReset();
    syncRates.mockReturnValue({ unwrap: () => Promise.resolve({ synced: 5 }) });
  });

  it('calls sync API when Sync rates is clicked', async () => {
    const user = userEvent.setup();

    render(
      <CurrencyRatesTable
        rates={[]}
        supportedCurrencies={['USD', 'INR']}
        lastFxSyncAt={null}
      />,
    );

    await user.click(screen.getByRole('button', { name: /sync rates/i }));

    expect(syncRates).toHaveBeenCalled();
  });

  it('only lists rates for supported target currencies', () => {
    render(
      <CurrencyRatesTable
        supportedCurrencies={['INR']}
        lastFxSyncAt={null}
        rates={[
          {
            id: '1',
            baseCurrency: 'USD',
            targetCurrency: 'INR',
            rate: 83,
            syncedAt: '2026-01-01T00:00:00.000Z',
          },
          {
            id: '2',
            baseCurrency: 'USD',
            targetCurrency: 'JPY',
            rate: 150,
            syncedAt: '2026-01-01T00:00:00.000Z',
          },
        ]}
      />,
    );

    expect(screen.getAllByText('INR').length).toBeGreaterThan(0);
    expect(screen.queryByText('JPY')).not.toBeInTheDocument();
    expect(screen.getByText('83')).toBeInTheDocument();
    expect(screen.queryByText('150')).not.toBeInTheDocument();
  });
});
