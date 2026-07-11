import { baseApi } from '@/infrastructure/api/base-api';
import type {
  DemoClearResult,
  DemoSeedResult,
  DemoStatus,
} from '@/domain/types/settings.types';

export const demoApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getDemoStatus: build.query<DemoStatus, void>({
      query: () => ({
        url: '/settings/demo/status',
        method: 'GET',
      }),
      providesTags: ['Settings'],
    }),
    seedDemo: build.mutation<DemoSeedResult, void>({
      query: () => ({
        url: '/settings/demo/seed',
        method: 'POST',
      }),
      invalidatesTags: [
        'Settings',
        'Employee',
        'Dashboard',
        'SalaryDraft',
        'CurrencyRate',
      ],
    }),
    clearDemo: build.mutation<DemoClearResult, void>({
      query: () => ({
        url: '/settings/demo/clear',
        method: 'POST',
      }),
      invalidatesTags: [
        'Settings',
        'Employee',
        'Dashboard',
        'SalaryDraft',
        'CurrencyRate',
      ],
    }),
  }),
});

export const {
  useGetDemoStatusQuery,
  useSeedDemoMutation,
  useClearDemoMutation,
} = demoApi;
