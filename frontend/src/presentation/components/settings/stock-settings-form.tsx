import React, { useState } from 'react';

import type { Settings } from '@/domain/types/settings.types';
import { formatApiErrorMessage } from '@/infrastructure/api/extract-api-error';
import { useUpdateSettingsMutation } from '@/infrastructure/api/settings-api';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';

export type StockSettingsFormProps = {
  settings: Settings;
};

export function StockSettingsForm({
  settings,
}: StockSettingsFormProps): React.ReactElement {
  const [totalStocks, setTotalStocks] = useState(String(settings.totalStocks));
  const [stockPrice, setStockPrice] = useState(String(settings.stockPrice));
  const [stockPriceCurrency, setStockPriceCurrency] = useState(
    settings.stockPriceCurrency,
  );
  const [updateSettings, { isLoading, error, isSuccess, reset }] =
    useUpdateSettingsMutation();

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    reset();
    try {
      await updateSettings({
        totalStocks: Number(totalStocks),
        stockPrice: Number(stockPrice),
        stockPriceCurrency: stockPriceCurrency.trim().toUpperCase(),
      }).unwrap();
    } catch {
      // Surfaced via mutation error
    }
  }

  return (
    <form
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      className="space-y-4 rounded-xl border border-border bg-surface p-4 shadow-xs"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="total-stocks">Total stocks</Label>
          <Input
            id="total-stocks"
            type="number"
            min={0}
            step={1}
            value={totalStocks}
            onChange={(event) => setTotalStocks(event.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="stock-price">Stock price</Label>
          <Input
            id="stock-price"
            type="number"
            min={0}
            step="0.01"
            value={stockPrice}
            onChange={(event) => setStockPrice(event.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="stock-price-currency">Price currency</Label>
          <select
            id="stock-price-currency"
            value={stockPriceCurrency}
            onChange={(event) => setStockPriceCurrency(event.target.value)}
            required
            className="flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink shadow-xs transition-theme focus-visible:border-brand focus-visible:shadow-focus focus-visible:outline-none"
          >
            {(settings.supportedCurrencies.length > 0
              ? settings.supportedCurrencies
              : [stockPriceCurrency]
            ).map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-danger" role="alert">
          {formatApiErrorMessage(error, 'Unable to save stock settings')}
        </p>
      ) : null}
      {isSuccess ? (
        <p className="text-sm text-success" role="status">
          Stock settings saved.
        </p>
      ) : null}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving…' : 'Save stock'}
      </Button>
    </form>
  );
}
