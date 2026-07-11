/**
 * Fixed catalog of countries HR may enable in Settings.
 * Each country maps to its primary payroll currency.
 */
export type CountryCurrencyOption = {
  country: string;
  currency: string;
};

export const COUNTRY_CURRENCY_CATALOG: readonly CountryCurrencyOption[] = [
  { country: 'US', currency: 'USD' },
  { country: 'UK', currency: 'GBP' },
  { country: 'India', currency: 'INR' },
  { country: 'Germany', currency: 'EUR' },
  { country: 'Singapore', currency: 'SGD' },
  { country: 'Canada', currency: 'CAD' },
  { country: 'Australia', currency: 'AUD' },
  { country: 'Japan', currency: 'JPY' },
  { country: 'France', currency: 'EUR' },
  { country: 'Netherlands', currency: 'EUR' },
  { country: 'Switzerland', currency: 'CHF' },
  { country: 'UAE', currency: 'AED' },
  { country: 'Brazil', currency: 'BRL' },
  { country: 'South Africa', currency: 'ZAR' },
  { country: 'Mexico', currency: 'MXN' },
] as const;

export const CATALOG_COUNTRIES: readonly string[] =
  COUNTRY_CURRENCY_CATALOG.map((row) => row.country);

/** Unique currencies from the country catalog (sorted). */
export const CATALOG_CURRENCIES: readonly string[] = [
  ...new Set(COUNTRY_CURRENCY_CATALOG.map((row) => row.currency)),
].sort();

export function currencyForCountry(country: string): string | undefined {
  return COUNTRY_CURRENCY_CATALOG.find((row) => row.country === country)
    ?.currency;
}

/** Currencies implied by the given supported countries. */
export function currenciesForCountries(countries: string[]): string[] {
  const codes = new Set<string>();
  for (const country of countries) {
    const currency = currencyForCountry(country);
    if (currency) {
      codes.add(currency);
    }
  }
  return [...codes].sort();
}
