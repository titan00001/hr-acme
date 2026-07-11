import React, { useMemo, useState } from 'react';

import {
  CATALOG_COUNTRIES,
  CATALOG_CURRENCIES,
  currenciesForCountries,
  currencyForCountry,
} from '@/domain/catalog/country-currency-catalog';
import type { Settings } from '@/domain/types/settings.types';
import { formatApiErrorMessage } from '@/infrastructure/api/extract-api-error';
import { useUpdateSettingsMutation } from '@/infrastructure/api/settings-api';
import { SelectRemoveList } from '@/presentation/components/settings/select-remove-list';
import { Button } from '@/presentation/components/ui/button';
import { Label } from '@/presentation/components/ui/label';
import { cn } from '@/presentation/lib/cn';

export type GeneralSettingsFormProps = {
  settings: Settings;
};

function normalizeInitialCountries(countries: string[]): string[] {
  return countries.filter((country) => CATALOG_COUNTRIES.includes(country));
}

function normalizeInitialCurrencies(currencies: string[]): string[] {
  return currencies.filter((code) => CATALOG_CURRENCIES.includes(code));
}

export function GeneralSettingsForm({
  settings,
}: GeneralSettingsFormProps): React.ReactElement {
  const [countries, setCountries] = useState(() =>
    normalizeInitialCountries(settings.supportedCountries),
  );
  const [currencies, setCurrencies] = useState(() => {
    const fromSettings = normalizeInitialCurrencies(
      settings.supportedCurrencies,
    );
    return fromSettings.length > 0
      ? fromSettings
      : currenciesForCountries(
          normalizeInitialCountries(settings.supportedCountries),
        );
  });
  const [baseCurrency, setBaseCurrency] = useState(() => {
    const initial = settings.baseCurrency.toUpperCase();
    return CATALOG_CURRENCIES.includes(initial) ? initial : 'USD';
  });
  const [updateSettings, { isLoading, error, isSuccess, reset }] =
    useUpdateSettingsMutation();

  const baseOptions = useMemo(() => {
    const set = new Set(currencies);
    if (baseCurrency) {
      set.add(baseCurrency);
    }
    return [...set].sort();
  }, [currencies, baseCurrency]);

  function handleCountriesChange(next: string[]): void {
    const previous = countries;
    setCountries(next);

    const added = next.filter((country) => !previous.includes(country));
    const removed = previous.filter((country) => !next.includes(country));
    const stillImplied = new Set(currenciesForCountries(next));

    setCurrencies((current) => {
      let nextCurrencies = [...current];
      for (const country of added) {
        const code = currencyForCountry(country);
        if (code && !nextCurrencies.includes(code)) {
          nextCurrencies.push(code);
        }
      }
      for (const country of removed) {
        const code = currencyForCountry(country);
        if (code && !stillImplied.has(code)) {
          nextCurrencies = nextCurrencies.filter((item) => item !== code);
        }
      }
      return nextCurrencies.sort();
    });

    setBaseCurrency((current) => {
      if (stillImplied.has(current)) {
        return current;
      }
      return [...stillImplied][0] ?? current;
    });
  }

  function handleCurrenciesChange(next: string[]): void {
    setCurrencies(next);
    if (next.length > 0 && !next.includes(baseCurrency)) {
      setBaseCurrency(next[0] ?? baseCurrency);
    }
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    reset();

    if (countries.length === 0 || currencies.length === 0) {
      return;
    }

    try {
      await updateSettings({
        baseCurrency,
        supportedCurrencies: currencies,
        supportedCountries: countries,
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
      className="space-y-3 rounded-xl border border-border bg-surface p-3 shadow-xs"
    >
      <div className="grid gap-3 lg:grid-cols-2">
        <SelectRemoveList
          id="supported-countries"
          label="Supported countries"
          hint="15-country catalog"
          values={countries}
          options={CATALOG_COUNTRIES}
          emptyLabel="Add at least one country."
          onChange={handleCountriesChange}
        />

        <SelectRemoveList
          id="supported-currencies"
          label="Supported currencies"
          hint="Salaries, FX, dashboard"
          values={currencies}
          options={CATALOG_CURRENCIES}
          emptyLabel="Add at least one currency."
          onChange={handleCurrenciesChange}
        />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-[8rem] flex-col gap-1">
          <Label htmlFor="base-currency" className="text-xs">
            Base currency
          </Label>
          <select
            id="base-currency"
            value={baseCurrency}
            onChange={(event) => setBaseCurrency(event.target.value)}
            required
            className={cn(
              'flex h-8 w-full max-w-[10rem] rounded-sm border border-border bg-surface px-2 text-xs text-ink shadow-xs transition-theme',
              'focus-visible:border-brand focus-visible:shadow-focus focus-visible:outline-none',
            )}
          >
            {baseOptions.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>

        <Button
          type="submit"
          size="sm"
          disabled={
            isLoading || countries.length === 0 || currencies.length === 0
          }
        >
          {isLoading ? 'Saving…' : 'Save general'}
        </Button>

        {isSuccess ? (
          <p className="text-xs text-success" role="status">
            Saved.
          </p>
        ) : null}
      </div>

      {countries.length === 0 || currencies.length === 0 ? (
        <p className="text-xs text-danger" role="alert">
          Select at least one country and one currency before saving.
        </p>
      ) : null}

      {error ? (
        <p className="text-xs text-danger" role="alert">
          {formatApiErrorMessage(error, 'Unable to save settings')}
        </p>
      ) : null}
    </form>
  );
}
