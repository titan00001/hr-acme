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
        lastFxSyncAt={null}
      />,
    );

    await user.click(screen.getByRole('button', { name: /sync rates/i }));

    expect(syncRates).toHaveBeenCalled();
  });
});
