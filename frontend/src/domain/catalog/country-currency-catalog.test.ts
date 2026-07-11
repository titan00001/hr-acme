import { describe, expect, it } from 'vitest';

import {
  CATALOG_COUNTRIES,
  CATALOG_CURRENCIES,
  COUNTRY_CURRENCY_CATALOG,
  currenciesForCountries,
  currencyForCountry,
} from './country-currency-catalog';

describe('country-currency-catalog', () => {
  it('lists 15 countries', () => {
    expect(COUNTRY_CURRENCY_CATALOG).toHaveLength(15);
    expect(CATALOG_COUNTRIES).toHaveLength(15);
  });

  it('maps countries to currencies and derives unique codes', () => {
    expect(currencyForCountry('India')).toBe('INR');
    expect(currenciesForCountries(['US', 'India', 'Germany'])).toEqual([
      'EUR',
      'INR',
      'USD',
    ]);
    expect(CATALOG_CURRENCIES).toContain('JPY');
  });
});
