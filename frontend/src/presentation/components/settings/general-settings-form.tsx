import React, { useState } from 'react';

import {
  formatCsvList,
  parseCsvList,
} from '@/domain/formatters/csv-list';
import type { Settings } from '@/domain/types/settings.types';
import { formatApiErrorMessage } from '@/infrastructure/api/extract-api-error';
import { useUpdateSettingsMutation } from '@/infrastructure/api/settings-api';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';

export type GeneralSettingsFormProps = {
  settings: Settings;
};

export function GeneralSettingsForm({
  settings,
}: GeneralSettingsFormProps): React.ReactElement {
  const [baseCurrency, setBaseCurrency] = useState(settings.baseCurrency);
  const [currenciesText, setCurrenciesText] = useState(
    formatCsvList(settings.supportedCurrencies),
  );
  const [countriesText, setCountriesText] = useState(
    formatCsvList(settings.supportedCountries),
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
        baseCurrency: baseCurrency.trim().toUpperCase(),
        supportedCurrencies: parseCsvList(currenciesText).map((code) =>
          code.toUpperCase(),
        ),
        supportedCountries: parseCsvList(countriesText),
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
      <div className="flex flex-col gap-2">
        <Label htmlFor="base-currency">Base currency</Label>
        <Input
          id="base-currency"
          value={baseCurrency}
          onChange={(event) => setBaseCurrency(event.target.value)}
          placeholder="USD"
          required
        />
        <p className="text-xs text-ink-subtle">
          Used as the FX sync base (e.g. ExchangeRate-API base).
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="supported-currencies">Supported currencies</Label>
        <Input
          id="supported-currencies"
          value={currenciesText}
          onChange={(event) => setCurrenciesText(event.target.value)}
          placeholder="USD, GBP, INR, EUR, SGD"
          required
        />
        <p className="text-xs text-ink-subtle">Comma-separated currency codes.</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="supported-countries">Supported countries</Label>
        <Input
          id="supported-countries"
          value={countriesText}
          onChange={(event) => setCountriesText(event.target.value)}
          placeholder="US, UK, India, Germany, Singapore"
          required
        />
        <p className="text-xs text-ink-subtle">
          Comma-separated country names used when onboarding.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-danger" role="alert">
          {formatApiErrorMessage(error, 'Unable to save settings')}
        </p>
      ) : null}
      {isSuccess ? (
        <p className="text-sm text-success" role="status">
          General settings saved.
        </p>
      ) : null}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving…' : 'Save general'}
      </Button>
    </form>
  );
}
