import { baseApi } from '@/infrastructure/api/base-api';
import type {
  PaginatedSalaryHistory,
  SalaryHistoryQuery,
} from '@/domain/types/salary.types';

export const salaryApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getSalaryHistory: build.query<
      PaginatedSalaryHistory,
      { employeeId: string; query?: SalaryHistoryQuery }
    >({
      query: ({ employeeId, query }) => ({
        url: `/employees/${employeeId}/salary/history`,
        method: 'GET',
        params: query,
      }),
      providesTags: (_result, _error, { employeeId }) => [
        { type: 'Employee', id: `${employeeId}-history` },
      ],
    }),
  }),
});

export const { useGetSalaryHistoryQuery } = salaryApi;
