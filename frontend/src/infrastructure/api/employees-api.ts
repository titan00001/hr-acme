import { baseApi } from '@/infrastructure/api/base-api';
import type {
  CreateEmployeeRequest,
  Employee,
  EmployeeQuery,
  PaginatedEmployees,
  RelieveEmployeeRequest,
  UpdateEmployeeRequest,
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
    getLeftEmployees: build.query<PaginatedEmployees, EmployeeQuery | void>({
      query: (params) => ({
        url: '/employees/left',
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
              { type: 'Employee', id: 'LEFT_LIST' },
            ]
          : [{ type: 'Employee', id: 'LEFT_LIST' }],
    }),
    getEmployee: build.query<Employee, string>({
      query: (id) => ({
        url: `/employees/${id}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'Employee', id }],
    }),
    createEmployee: build.mutation<Employee, CreateEmployeeRequest>({
      query: (body) => ({
        url: '/employees',
        method: 'POST',
        data: body,
      }),
      invalidatesTags: [{ type: 'Employee', id: 'LIST' }, { type: 'Employee', id: 'LEFT_LIST' }],
    }),
    updateEmployee: build.mutation<
      Employee,
      { id: string; body: UpdateEmployeeRequest }
    >({
      query: ({ id, body }) => ({
        url: `/employees/${id}`,
        method: 'PATCH',
        data: body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Employee', id },
        { type: 'Employee', id: 'LIST' },
        { type: 'Employee', id: 'LEFT_LIST' },
      ],
    }),
    relieveEmployee: build.mutation<
      Employee,
      { id: string; body?: RelieveEmployeeRequest }
    >({
      query: ({ id, body }) => ({
        url: `/employees/${id}/relieve`,
        method: 'POST',
        data: body ?? {},
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Employee', id },
        { type: 'Employee', id: 'LIST' },
        { type: 'Employee', id: 'LEFT_LIST' },
      ],
    }),
  }),
});

export const {
  useGetEmployeesQuery,
  useGetLeftEmployeesQuery,
  useGetEmployeeQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useRelieveEmployeeMutation,
} = employeesApi;
