import { baseApi } from '@/infrastructure/api/base-api';
import type {
  CurrencyRate,
  SyncCurrencyRatesResult,
} from '@/domain/types/settings.types';

export const currencyRatesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getCurrencyRates: build.query<CurrencyRate[], void>({
      query: () => ({
        url: '/settings/currency-rates',
        method: 'GET',
      }),
      providesTags: ['CurrencyRate'],
    }),
    syncCurrencyRates: build.mutation<SyncCurrencyRatesResult, void>({
      query: () => ({
        url: '/settings/currency-rates/sync',
        method: 'POST',
      }),
      invalidatesTags: ['CurrencyRate', 'Settings', 'Dashboard'],
    }),
  }),
});

export const { useGetCurrencyRatesQuery, useSyncCurrencyRatesMutation } =
  currencyRatesApi;
