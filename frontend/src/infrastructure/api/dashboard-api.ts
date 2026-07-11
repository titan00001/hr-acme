import { baseApi } from '@/infrastructure/api/base-api';
import type {
  CountryBreakdown,
  DashboardCurrencyQuery,
  DashboardRecentQuery,
  DashboardSummary,
  DashboardTrendsQuery,
  DistributionBucket,
  PaginatedRecentRevisions,
  TrendPoint,
} from '@/domain/types/dashboard.types';

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getDashboardSummary: build.query<DashboardSummary, DashboardCurrencyQuery>({
      query: (params) => ({
        url: '/dashboard/summary',
        method: 'GET',
        params,
      }),
      providesTags: ['Dashboard'],
    }),
    getDashboardByCountry: build.query<
      CountryBreakdown[],
      DashboardCurrencyQuery
    >({
      query: (params) => ({
        url: '/dashboard/by-country',
        method: 'GET',
        params,
      }),
      providesTags: ['Dashboard'],
    }),
    getDashboardDistribution: build.query<
      DistributionBucket[],
      DashboardCurrencyQuery
    >({
      query: (params) => ({
        url: '/dashboard/distribution',
        method: 'GET',
        params,
      }),
      providesTags: ['Dashboard'],
    }),
    getDashboardTrends: build.query<TrendPoint[], DashboardTrendsQuery>({
      query: (params) => ({
        url: '/dashboard/trends',
        method: 'GET',
        params,
      }),
      providesTags: ['Dashboard'],
    }),
    getRecentRevisions: build.query<
      PaginatedRecentRevisions,
      DashboardRecentQuery | void
    >({
      query: (params) => ({
        url: '/dashboard/recent-revisions',
        method: 'GET',
        params: params ?? undefined,
      }),
      providesTags: ['Dashboard'],
    }),
  }),
});

export const {
  useGetDashboardSummaryQuery,
  useGetDashboardByCountryQuery,
  useGetDashboardDistributionQuery,
  useGetDashboardTrendsQuery,
  useGetRecentRevisionsQuery,
} = dashboardApi;
