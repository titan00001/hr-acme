import { baseApi } from '@/infrastructure/api/base-api';
import type {
  EmployeeQuery,
  PaginatedEmployees,
} from '@/domain/types/employee.types';

export const employeesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getEmployees: build.query<PaginatedEmployees, EmployeeQuery | void>({
      query: (params) => ({
        url: '/employees',
        method: 'GET',
        params: params ?? undefined,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((employee) => ({
                type: 'Employee' as const,
                id: employee.id,
              })),
              { type: 'Employee', id: 'LIST' },
            ]
          : [{ type: 'Employee', id: 'LIST' }],
    }),
  }),
});

export const { useGetEmployeesQuery } = employeesApi;
